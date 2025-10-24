// Утилиты для работы с IndexedDB для сохранения данных жестов
import Dexie from 'dexie';

// Создание базы данных с использованием Dexie
const db = new Dexie('GestureRecognitionDB');

// Определение схемы базы данных
db.version(1).stores({
  gestures: 'id'
});

// Сохранение данных в IndexedDB
export const saveToIndexedDB = async (key, data) => {
  await db.gestures.put({ id: key, data });
};

// Загрузка данных из IndexedDB
export const loadFromIndexedDB = async (key) => {
  const result = await db.gestures.get(key);
  return result?.data ?? null;
};

// Очистка всех данных из IndexedDB
export const clearIndexedDB = async () => {
  await db.gestures.clear();
};

// Сохранение данных жестов в IndexedDB
export const saveGestureData = async (classes, trainingData) => {
  try {
    // Сохраняем в IndexedDB через Dexie
    await saveToIndexedDB('gesture-classes', classes);
    await saveToIndexedDB('training-data', trainingData);

    console.log('Сохранено классов в IndexedDB:', classes.length);
    console.log('Сохранено обучающих данных в IndexedDB:', Object.keys(trainingData).length);
  } catch (error) {
    console.error('Ошибка сохранения в IndexedDB:', error);
    throw new Error('Не удалось сохранить данные');
  }
};

// Загрузка данных жестов из IndexedDB
export const loadGestureData = async () => {
  try {
    // Загружаем из IndexedDB через Dexie
    const savedClasses = await loadFromIndexedDB('gesture-classes');
    const savedTrainingData = await loadFromIndexedDB('training-data');

    if (!savedClasses) {
      console.log('Нет сохраненных данных в IndexedDB');
      return null;
    }

    const classes = savedClasses;
    const trainingData = savedTrainingData || {};

    console.log('Загружено классов из IndexedDB:', classes.length);
    console.log('Восстановлено обучающих данных из IndexedDB:', Object.keys(trainingData).length);

    return { classes, trainingData };
  } catch (error) {
    console.error('Ошибка загрузки из IndexedDB:', error);
    return null;
  }
};

// Очистка всех данных жестов из IndexedDB
export const clearGestureData = async () => {
  try {
    await clearIndexedDB();
    console.log('Все сохраненные данные очищены из IndexedDB');
  } catch (error) {
    console.error('Ошибка очистки данных:', error);
    throw error;
  }
};

