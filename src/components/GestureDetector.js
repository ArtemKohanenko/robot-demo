import React from 'react';
import { useGesture } from '../state/gestureContext';
import './GestureDetector.css';

export function GestureDetector({ targetGesture, onGestureDetected, onClose }) {
  const { gestureState, getHandDetector, predictGesture } = useGesture();
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const streamRef = React.useRef(null);

  React.useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Ошибка доступа к камере:', error);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const detector = getHandDetector();
    if (!detector || !videoRef.current) return;

    const detectGesture = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectGesture);
        return;
      }

      try {
        const hands = await detector.estimateHands(videoRef.current);
        
        // Рисуем руки на canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (hands.length > 0) {
            drawHands(ctx, hands);
          }
        }

        if (hands.length > 0) {
          const keypoints = hands[0].keypoints;
          const result = await predictGesture(keypoints);
          
          if (result && result.confidence >= gestureState.confidenceThreshold) {
            if (result.className === targetGesture) {
              onGestureDetected(true);
              return; // Прекращаем обнаружение после успешного распознавания
            }
          }
        }
      } catch (error) {
        console.error('Ошибка распознавания жеста:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectGesture);
    };

    const startDetection = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        detectGesture();
      } else if (videoRef.current) {
        videoRef.current.addEventListener('loadeddata', detectGesture, { once: true });
      }
    };

    startDetection();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetGesture, gestureState.confidenceThreshold, getHandDetector, predictGesture, onGestureDetected]);

  const drawHands = (ctx, hands) => {
    hands.forEach(hand => {
      // Рисуем точки
      hand.keypoints.forEach(kp => {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      });

      // Рисуем соединения
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // большой палец
        [0, 5], [5, 6], [6, 7], [7, 8], // указательный
        [0, 9], [9, 10], [10, 11], [11, 12], // средний
        [0, 13], [13, 14], [14, 15], [15, 16], // безымянный
        [0, 17], [17, 18], [18, 19], [19, 20], // мизинец
      ];

      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      connections.forEach(([start, end]) => {
        const kp1 = hand.keypoints[start];
        const kp2 = hand.keypoints[end];
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      });
    });
  };

  return (
    <div className="gesture-detector-overlay">
      <div className="gesture-detector-container">
        <div className="gesture-detector-header">
          <h3>👋 Покажите: {targetGesture}</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        <div className="gesture-detector-content">
          <div className="video-container">
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
              className="overlay-canvas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

