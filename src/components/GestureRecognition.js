import React, { useEffect, useRef, useState } from 'react';
import { useGesture } from '../state/gestureContext';
import './GestureRecognition.css';

function GestureRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(undefined);
  const monitoringFrameRef = useRef(undefined);

  const {
    gestureState,
    addGestureClass,
    addGestureExample,
    removeGestureClass,
    predictGesture,
    updatePrediction,
    updateConfidenceThreshold,
    saveGestures,
    resetGestures,
    getNumClasses,
    getHandDetector
  } = useGesture();

  const {
    gestureClasses,
    isModelLoaded,
    prediction,
    confidence,
    confidenceThreshold
  } = gestureState;

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);

  // Рисование ключевых точек рук на canvas
  const drawHands = (handsData) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    handsData.forEach((hand, index) => {
      const keypoints = hand.keypoints;
      const colors = ['#00FF00', '#FF6B6B'];
      const color = colors[index % colors.length];

      ctx.fillStyle = color;
      keypoints.forEach((kp) => {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
      ];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      connections.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(keypoints[i].x, keypoints[i].y);
        ctx.lineTo(keypoints[j].x, keypoints[j].y);
        ctx.stroke();
      });

      if (hand.handedness) {
        ctx.fillStyle = color;
        ctx.font = '16px Arial';
        ctx.fillText(
          hand.handedness === 'Left' ? 'Левая' : 'Правая',
          keypoints[0].x + 10,
          keypoints[0].y - 10
        );
      }
    });
  };

  // Инициализация веб-камеры
  useEffect(() => {
    const video = videoRef.current;
    const setupCamera = async () => {
      if (!video) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        alert('Не удалось получить доступ к веб-камере');
      }
    };
    setupCamera();

    return () => {
      if (video?.srcObject) {
        const stream = video.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (monitoringFrameRef.current) {
        cancelAnimationFrame(monitoringFrameRef.current);
      }
    };
  }, []);

  // Постоянный мониторинг наличия руки для индикатора
  useEffect(() => {
    const handDetector = getHandDetector();

    const monitorHand = async () => {
      if (!handDetector || !videoRef.current || !isCameraReady) {
        monitoringFrameRef.current = requestAnimationFrame(monitorHand);
        return;
      }

      try {
        const hands = await handDetector.estimateHands(videoRef.current);

        if (hands.length > 0) {
          setIsHandDetected(true);
          const handsData = hands.map(hand => ({
            keypoints: hand.keypoints,
            handedness: hand.handedness
          }));
          drawHands(handsData);
        } else {
          setIsHandDetected(false);
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      } catch (error) {
        console.error('Ошибка мониторинга руки:', error);
      }

      monitoringFrameRef.current = requestAnimationFrame(monitorHand);
    };

    if (isModelLoaded && isCameraReady && !isPredicting) {
      monitorHand();
    }

    return () => {
      if (monitoringFrameRef.current) {
        cancelAnimationFrame(monitoringFrameRef.current);
      }
    };
  }, [isModelLoaded, isCameraReady, isPredicting, getHandDetector]);

  // Добавление нового класса жеста
  const handleAddGestureClass = () => {
    try {
      addGestureClass(newClassName);
      setNewClassName('');
    } catch (error) {
      alert(error.message);
    }
  };

  // Добавление образца жеста
  const handleAddExample = async (classId) => {
    const handDetector = getHandDetector();
    if (!handDetector || !videoRef.current || !isCameraReady) {
      alert('Модель или камера еще не готовы');
      return;
    }

    setIsTraining(true);
    try {
      const hands = await handDetector.estimateHands(videoRef.current);

      if (hands.length === 0) {
        alert('Рука не обнаружена! Покажите руку перед камерой');
        setIsTraining(false);
        return;
      }

      const hand = hands[0];
      const keypoints = hand.keypoints;

      addGestureExample(classId, keypoints);
    } catch (error) {
      console.error('Ошибка добавления образца:', error);
      alert(error.message);
    }
    setIsTraining(false);
  };

  // Удаление класса жеста
  const handleRemoveGestureClass = async (classId) => {
    try {
      await removeGestureClass(classId);
      updatePrediction('Класс удален, данные переобучены', 0);
    } catch (error) {
      console.error('Ошибка удаления класса:', error);
      alert(error.message);
    }
  };

  // Предсказание жеста
  const predict = async () => {
    const handDetector = getHandDetector();
    if (!handDetector || !videoRef.current || !isCameraReady) return;

    try {
      const hands = await handDetector.estimateHands(videoRef.current);

      if (hands.length === 0) {
        setIsHandDetected(false);
        updatePrediction('Рука не обнаружена', 0);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        setIsHandDetected(true);
        const handsData = hands.map(hand => ({
          keypoints: hand.keypoints,
          handedness: hand.handedness
        }));

        drawHands(handsData);

        if (getNumClasses() > 0) {
          const primaryHand = hands[0];
          const keypoints = primaryHand.keypoints;
          
          const result = await predictGesture(keypoints);

          if (result) {
            if (result.confidence >= confidenceThreshold) {
              updatePrediction(result.className, result.confidence);
            } else {
              updatePrediction('Неуверенное предсказание', result.confidence);
            }
          }
        }
      }
    } catch (error) {
      console.error('Ошибка предсказания:', error);
    }

    if (isPredicting) {
      animationFrameRef.current = requestAnimationFrame(predict);
    }
  };

  // Запуск непрерывного распознавания
  const startPredicting = () => {
    if (getNumClasses() === 0) {
      alert('Сначала обучите классификатор, добавив образцы жестов');
      return;
    }
    if (monitoringFrameRef.current) {
      cancelAnimationFrame(monitoringFrameRef.current);
    }
    setIsPredicting(true);
    predict();
  };

  // Остановка распознавания
  const stopPredicting = () => {
    setIsPredicting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updatePrediction('Остановлено', 0);
  };

  // Обновление при изменении isPredicting
  useEffect(() => {
    if (isPredicting) {
      predict();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPredicting]);

  // Сохранение в IndexedDB
  const handleSaveGestures = async () => {
    setIsSaving(true);
    try {
      await saveGestures();
      alert('Модель и классы успешно сохранены в IndexedDB!');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(error.message);
    }
    setIsSaving(false);
  };

  // Сброс классификатора
  const handleResetGestures = async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPredicting(false);
    setIsHandDetected(false);

    await resetGestures();

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="gesture-recognition">
      <h2>🎯 Распознавание жестов руками</h2>

      <div className="gesture-status">
        <div className={`gesture-status-item ${isModelLoaded ? 'ready' : 'loading'}`}>
          Модель: {isModelLoaded ? '✅' : '⏳'}
        </div>
        <div className={`gesture-status-item ${isCameraReady ? 'ready' : 'loading'}`}>
          Камера: {isCameraReady ? '✅' : '⏳'}
        </div>
        <div className={`gesture-status-item ${isHandDetected ? 'ready' : 'inactive'}`}>
          Рука: {isHandDetected ? '✅' : '⚪'}
        </div>
        {gestureClasses.length > 0 && (
          <div className="gesture-status-item ready">
            Классов: {gestureClasses.length}
          </div>
        )}
      </div>

      <div className="gesture-content">
        <div className="gesture-video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width="320"
            height="240"
          />
          <canvas
            ref={canvasRef}
            width="320"
            height="240"
            className="gesture-hand-overlay"
          />
          {isTraining && <div className="gesture-training-overlay">Добавление образца...</div>}
        </div>

        <div className="gesture-controls">
          <div className="gesture-add-class">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Название жеста"
              className="gesture-class-input"
            />
            <button
              onClick={handleAddGestureClass}
              disabled={!newClassName.trim()}
              className="gesture-add-button"
            >
              ➕
            </button>
          </div>

          <div className="gesture-classes">
            {gestureClasses.length === 0 ? (
              <p className="gesture-no-classes">Добавьте класс жеста</p>
            ) : (
              gestureClasses.map((gestureClass) => (
                <div key={gestureClass.id} className="gesture-class-row">
                  <button
                    onClick={() => handleAddExample(gestureClass.id)}
                    disabled={!isModelLoaded || !isCameraReady || isTraining}
                    className="gesture-train-button"
                  >
                    {gestureClass.name}
                  </button>
                  <span className="gesture-count">{gestureClass.count}</span>
                  <button
                    onClick={() => handleRemoveGestureClass(gestureClass.id)}
                    className="gesture-remove-button"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="gesture-prediction">
            <div className="gesture-prediction-text">{prediction}</div>
            {confidence > 0 && (
              <div className="gesture-confidence">
                <div
                  className="gesture-confidence-bar"
                  style={{ width: `${confidence}%` }}
                />
                <span className="gesture-confidence-value">{confidence.toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="gesture-actions">
            <button
              onClick={startPredicting}
              disabled={!isModelLoaded || !isCameraReady || isPredicting}
              className="gesture-action-button start"
            >
              ▶️
            </button>
            <button
              onClick={stopPredicting}
              disabled={!isPredicting}
              className="gesture-action-button stop"
            >
              ⏸️
            </button>
            <button
              onClick={handleResetGestures}
              className="gesture-action-button reset"
            >
              🔄
            </button>
            <button
              onClick={handleSaveGestures}
              disabled={getNumClasses() === 0 || isSaving}
              className="gesture-action-button save"
            >
              💾
            </button>
          </div>

          <div className="gesture-threshold">
            <label>Уверенность: {confidenceThreshold}%</label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={confidenceThreshold}
              onChange={(e) => updateConfidenceThreshold(Number(e.target.value))}
              className="gesture-threshold-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestureRecognition;
