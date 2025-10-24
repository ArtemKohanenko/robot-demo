/**
 * Улучшенное извлечение признаков для распознавания жестов
 * Создает признаки инвариантные к позиции, размеру и частично к повороту руки
 */

/**
 * Вычисляет евклидово расстояние между двумя точками
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Вычисляет угол между тремя точками (в радианах)
 * angle = arccos((BA · BC) / (|BA| × |BC|))
 */
function angle(p1, p2, p3) {
  // Векторы от p2 к p1 и от p2 к p3
  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: (p1.z || 0) - (p2.z || 0)
  };
  const v2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: (p3.z || 0) - (p2.z || 0)
  };
  
  // Скалярное произведение
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  
  // Длины векторов
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  
  if (len1 === 0 || len2 === 0) return 0;
  
  // Косинус угла
  const cosAngle = dot / (len1 * len2);
  // Ограничиваем значение для избежания ошибок округления
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  
  return Math.acos(clampedCos);
}

/**
 * Извлекает улучшенные признаки из ключевых точек руки
 * MediaPipe Hand landmarks: 21 точка
 * 
 * Индексы точек:
 * 0: Запястье (WRIST)
 * 1-4: Большой палец (THUMB_CMC, MCP, IP, TIP)
 * 5-8: Указательный (INDEX_FINGER_MCP, PIP, DIP, TIP)
 * 9-12: Средний (MIDDLE_FINGER_MCP, PIP, DIP, TIP)
 * 13-16: Безымянный (RING_FINGER_MCP, PIP, DIP, TIP)
 * 17-20: Мизинец (PINKY_MCP, PIP, DIP, TIP)
 */
export function extractGestureFeatures(keypoints) {
  if (!keypoints || keypoints.length !== 21) {
    throw new Error('Требуется 21 ключевая точка руки');
  }
  
  const features = [];
  
  // 1. Нормализация по размеру руки
  // Используем расстояние от запястья (0) до среднего пальца MCP (9)
  const wrist = keypoints[0];
  const middleFingerBase = keypoints[9];
  const handSize = distance(wrist, middleFingerBase);
  
  // Защита от деления на ноль
  const normFactor = handSize > 0.01 ? handSize : 1;
  
  // 2. Нормализованные координаты относительно запястья
  // Это делает признаки инвариантными к позиции руки в кадре
  for (let i = 1; i < 21; i++) {
    const kp = keypoints[i];
    features.push(
      (kp.x - wrist.x) / normFactor,
      (kp.y - wrist.y) / normFactor,
      ((kp.z || 0) - (wrist.z || 0)) / normFactor
    );
  }
  // 20 точек × 3 координаты = 60 признаков
  
  // 3. Углы в суставах пальцев
  // Большой палец
  features.push(angle(keypoints[1], keypoints[2], keypoints[3])); // CMC-MCP-IP
  features.push(angle(keypoints[2], keypoints[3], keypoints[4])); // MCP-IP-TIP
  
  // Указательный палец
  features.push(angle(keypoints[5], keypoints[6], keypoints[7])); // MCP-PIP-DIP
  features.push(angle(keypoints[6], keypoints[7], keypoints[8])); // PIP-DIP-TIP
  
  // Средний палец
  features.push(angle(keypoints[9], keypoints[10], keypoints[11]));
  features.push(angle(keypoints[10], keypoints[11], keypoints[12]));
  
  // Безымянный палец
  features.push(angle(keypoints[13], keypoints[14], keypoints[15]));
  features.push(angle(keypoints[14], keypoints[15], keypoints[16]));
  
  // Мизинец
  features.push(angle(keypoints[17], keypoints[18], keypoints[19]));
  features.push(angle(keypoints[18], keypoints[19], keypoints[20]));
  // 10 углов
  
  // 4. Расстояния между кончиками пальцев (нормализованные)
  // Это помогает различать жесты типа "ок", "peace" и т.д.
  const fingerTips = [4, 8, 12, 16, 20]; // Кончики всех пальцев
  
  for (let i = 0; i < fingerTips.length; i++) {
    for (let j = i + 1; j < fingerTips.length; j++) {
      const dist = distance(keypoints[fingerTips[i]], keypoints[fingerTips[j]]);
      features.push(dist / normFactor);
    }
  }
  // C(5,2) = 10 расстояний
  
  // 5. Расстояния от кончиков пальцев до запястья (нормализованные)
  for (const tipIndex of fingerTips) {
    const dist = distance(keypoints[tipIndex], wrist);
    features.push(dist / normFactor);
  }
  // 5 расстояний
  
  // 6. Углы между векторами пальцев (от основания к кончику)
  const fingerBases = [1, 5, 9, 13, 17]; // Основания пальцев
  
  for (let i = 0; i < fingerBases.length; i++) {
    for (let j = i + 1; j < fingerBases.length; j++) {
      const baseI = fingerBases[i];
      const tipI = fingerTips[i];
      const baseJ = fingerBases[j];
      const tipJ = fingerTips[j];
      
      features.push(angle(
        keypoints[tipI],
        keypoints[baseI],
        keypoints[tipJ]
      ));
    }
  }
  // C(5,2) = 10 углов
  
  // Итого: 60 + 10 + 10 + 5 + 10 = 95 признаков
  // Больше чем 63, но гораздо информативнее!
  
  return features;
}

/**
 * Альтернативная версия с меньшим количеством признаков (для более быстрой работы)
 * Используйте эту версию если производительность критична
 */
export function extractGestureFeaturesLight(keypoints) {
  if (!keypoints || keypoints.length !== 21) {
    throw new Error('Требуется 21 ключевая точка руки');
  }
  
  const features = [];
  
  // Нормализация
  const wrist = keypoints[0];
  const middleFingerBase = keypoints[9];
  const handSize = distance(wrist, middleFingerBase);
  const normFactor = handSize > 0.01 ? handSize : 1;
  
  // 1. Нормализованные координаты (60 признаков)
  for (let i = 1; i < 21; i++) {
    const kp = keypoints[i];
    features.push(
      (kp.x - wrist.x) / normFactor,
      (kp.y - wrist.y) / normFactor,
      ((kp.z || 0) - (wrist.z || 0)) / normFactor
    );
  }
  
  // 2. Только углы в суставах (10 признаков)
  features.push(angle(keypoints[1], keypoints[2], keypoints[3]));
  features.push(angle(keypoints[2], keypoints[3], keypoints[4]));
  features.push(angle(keypoints[5], keypoints[6], keypoints[7]));
  features.push(angle(keypoints[6], keypoints[7], keypoints[8]));
  features.push(angle(keypoints[9], keypoints[10], keypoints[11]));
  features.push(angle(keypoints[10], keypoints[11], keypoints[12]));
  features.push(angle(keypoints[13], keypoints[14], keypoints[15]));
  features.push(angle(keypoints[14], keypoints[15], keypoints[16]));
  features.push(angle(keypoints[17], keypoints[18], keypoints[19]));
  features.push(angle(keypoints[18], keypoints[19], keypoints[20]));
  
  // Итого: 70 признаков (компромисс между качеством и скоростью)
  
  return features;
}

/**
 * Выбор версии функции извлечения признаков
 * По умолчанию используется полная версия
 */
export default extractGestureFeatures;

