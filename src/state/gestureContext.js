import React from "react";
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { saveGestureData, loadGestureData, clearGestureData } from '../utils/indexedDB';
import extractGestureFeatures from '../utils/gestureFeatures';

const GestureContext = React.createContext(null);

export function GestureProvider({ children }) {
  const [gestureState, setGestureState] = React.useState({
    gestureClasses: [],
    trainingData: {},
    isModelLoaded: false,
    isLoading: true,
    prediction: 'Нет предсказания',
    confidence: 0,
    confidenceThreshold: 70,
  });

  // Refs для объектов, которые не должны вызывать ре-рендер
  const handDetectorRef = React.useRef(null);
  const classifierRef = React.useRef(null);

  // Инициализация модели при загрузке приложения
  React.useEffect(() => {
    const initializeModel = async () => {
      try {
        setGestureState(prev => ({ ...prev, isLoading: true }));

        // Инициализация TensorFlow.js
        await tf.ready();

        // Создание классификатора KNN
        classifierRef.current = knnClassifier.create();

        // Загрузка MediaPipe Hands модели
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
          runtime: 'tfjs',
          modelType: 'lite',
          maxHands: 2,
        };
        const detector = await handPoseDetection.createDetector(model, detectorConfig);
        handDetectorRef.current = detector;

        console.log('MediaPipe Hands модель загружена');

        // Загрузка сохраненных жестов из IndexedDB
        await loadSavedGestures();

        setGestureState(prev => ({
          ...prev,
          isModelLoaded: true,
          isLoading: false
        }));

      } catch (error) {
        console.error('Ошибка инициализации модели:', error);
        setGestureState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeModel();
  }, []);

  // Загрузка сохраненных жестов из IndexedDB
  const loadSavedGestures = async () => {
    try {
      const gestureData = await loadGestureData();

      if (!gestureData) {
        console.log('Нет сохраненных жестов');
        return;
      }

      // Восстанавливаем классы
      setGestureState(prev => ({
        ...prev,
        gestureClasses: gestureData.classes,
        trainingData: gestureData.trainingData
      }));

      // Восстанавливаем классификатор из данных обучения
      if (classifierRef.current) {
        classifierRef.current.clearAllClasses();

        for (const [classIdStr, dataArray] of Object.entries(gestureData.trainingData)) {
          const classId = parseInt(classIdStr);
          for (const featuresArray of dataArray) {
            const features = tf.tensor2d([featuresArray]);
            classifierRef.current.addExample(features, classId);
            features.dispose();
          }
        }
      }

      console.log('Жесты загружены из IndexedDB:', gestureData.classes.length);
    } catch (err) {
      console.error('Ошибка загрузки жестов:', err);
    }
  };

  // Утилиты для работы с жестами
  const gestureUtils = {
    // Добавление нового класса жеста
    addGestureClass: (className) => {
      if (!className.trim()) {
        throw new Error('Введите название класса');
      }

      if (gestureState.gestureClasses.some(cls => cls.name === className.trim())) {
        throw new Error('Класс с таким названием уже существует');
      }

      const newClass = {
        id: gestureState.gestureClasses.length,
        name: className.trim(),
        count: 0
      };

      setGestureState(prev => ({
        ...prev,
        gestureClasses: [...prev.gestureClasses, newClass]
      }));

      return newClass;
    },

    // Добавление образца жеста
    addGestureExample: (classId, keypoints) => {
      if (!classifierRef.current) {
        throw new Error('Классификатор не инициализирован');
      }

      // Извлечение улучшенных признаков из ключевых точек
      const features = extractGestureFeatures(keypoints);
      const featuresTensor = tf.tensor2d([features]);

      // Добавление в классификатор
      classifierRef.current.addExample(featuresTensor, classId);

      // Сохранение в trainingData
      const featuresArray = featuresTensor.arraySync();
      setGestureState(prev => {
        const newTrainingData = {
          ...prev.trainingData,
          [classId]: [...(prev.trainingData[classId] || []), featuresArray[0]]
        };

        // Обновление счетчика примеров
        const newGestureClasses = prev.gestureClasses.map(cls =>
          cls.id === classId ? { ...cls, count: cls.count + 1 } : cls
        );

        return {
          ...prev,
          gestureClasses: newGestureClasses,
          trainingData: newTrainingData
        };
      });

      featuresTensor.dispose();
    },

    // Удаление класса жеста
    removeGestureClass: async (classId) => {
      if (!classifierRef.current) {
        throw new Error('Классификатор не инициализирован');
      }

      setGestureState(prev => {
        // Удаление класса
        const filtered = prev.gestureClasses.filter(cls => cls.id !== classId);
        const newGestureClasses = filtered.map((cls, index) => ({ ...cls, id: index }));

        // Обновление данных обучения
        const newTrainingData = {};
        let newId = 0;
        for (const [idStr, data] of Object.entries(prev.trainingData)) {
          const id = parseInt(idStr);
          if (id !== classId) {
            newTrainingData[newId] = data;
            newId++;
          }
        }

        return {
          ...prev,
          gestureClasses: newGestureClasses,
          trainingData: newTrainingData
        };
      });

      // Переобучение классификатора
      await gestureUtils.restoreTrainingData();
    },

    // Восстановление данных обучения в классификаторе
    restoreTrainingData: async () => {
      if (!classifierRef.current) return;

      classifierRef.current.clearAllClasses();

      for (const [classIdStr, dataArray] of Object.entries(gestureState.trainingData)) {
        const classId = parseInt(classIdStr);
        for (const featuresArray of dataArray) {
          const features = tf.tensor2d([featuresArray]);
          classifierRef.current.addExample(features, classId);
          features.dispose();
        }
      }
    },

    // Предсказание жеста по ключевым точкам
    predictGesture: async (keypoints) => {
      if (!classifierRef.current || classifierRef.current.getNumClasses() === 0) {
        return null;
      }

      // Извлечение улучшенных признаков из ключевых точек
      const features = extractGestureFeatures(keypoints);
      const featuresTensor = tf.tensor2d([features]);

      const result = await classifierRef.current.predictClass(featuresTensor);
      featuresTensor.dispose();

      const labelNum = Number(result.label);
      const confidenceValue = result.confidences[labelNum] * 100;
      const predictedClass = gestureState.gestureClasses.find(cls => cls.id === labelNum);

      return {
        className: predictedClass?.name || 'Неизвестно',
        confidence: confidenceValue,
        classId: labelNum
      };
    },

    // Обновление предсказания в состоянии
    updatePrediction: (prediction, confidence) => {
      setGestureState(prev => ({
        ...prev,
        prediction,
        confidence
      }));
    },

    // Обновление порога уверенности
    updateConfidenceThreshold: (threshold) => {
      setGestureState(prev => ({
        ...prev,
        confidenceThreshold: threshold
      }));
    },

    // Сохранение жестов в IndexedDB
    saveGestures: async () => {
      if (!classifierRef.current || classifierRef.current.getNumClasses() === 0) {
        throw new Error('Нет данных для сохранения. Сначала обучите классификатор.');
      }

      try {
        await saveGestureData(gestureState.gestureClasses, gestureState.trainingData);
        console.log('Жесты сохранены в IndexedDB');
        return true;
      } catch (error) {
        console.error('Ошибка сохранения жестов:', error);
        throw error;
      }
    },

    // Сброс всех жестов
    resetGestures: async () => {
      if (classifierRef.current) {
        classifierRef.current.clearAllClasses();
      }

      setGestureState(prev => ({
        ...prev,
        gestureClasses: [],
        trainingData: {},
        prediction: 'Классификатор сброшен',
        confidence: 0
      }));

      try {
        await clearGestureData();
        console.log('Все жесты удалены');
      } catch (error) {
        console.error('Ошибка очистки данных:', error);
      }
    },

    // Получение количества классов
    getNumClasses: () => {
      return classifierRef.current ? classifierRef.current.getNumClasses() : 0;
    },

    // Получение детектора рук
    getHandDetector: () => {
      return handDetectorRef.current;
    },

    // Получение классификатора
    getClassifier: () => {
      return classifierRef.current;
    }
  };

  const contextValue = {
    gestureState,
    ...gestureUtils
  };

  return (
    <GestureContext.Provider value={contextValue}>
      {children}
    </GestureContext.Provider>
  );
}

export function useGesture() {
  const context = React.useContext(GestureContext);
  if (!context) {
    throw new Error("useGesture must be used within GestureProvider");
  }
  return context;
}

