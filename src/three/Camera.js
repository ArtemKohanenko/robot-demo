import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'

// Константы для камеры и управления
export const CAMERA_MARGIN = 1.35;
export const CAMERA_DISTANCE_FACTOR = 1.2;
export const DEFAULT_MIN_ZOOM = 0.5;
export const DEFAULT_MAX_ZOOM = 200;
export const DEFAULT_ZOOM_SPEED = 1.1;

// Вспомогательные функции для управления камерой
const initializeCameraTarget = (camera, targetRef) => {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  // Цель — пересечение луча взгляда с плоскостью Y=0 (земля)
  const t = -camera.position.y / dir.y;
  const look = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(t));
  if (Number.isFinite(look.x)) targetRef.current.copy(look);
};

const calculateWorldPoint = (camera, targetRef, size, ndcX, ndcY) => {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const right = new THREE.Vector3().copy(dir).cross(camera.up).normalize();
  const upScreen = new THREE.Vector3().copy(right).cross(dir).normalize();
  
  const halfWorldW = (size.width / camera.zoom) / 2;
  const halfWorldH = (size.height / camera.zoom) / 2;
  
  return new THREE.Vector3()
    .copy(targetRef.current)
    .add(right.multiplyScalar(ndcX * halfWorldW))
    .add(upScreen.multiplyScalar(ndcY * halfWorldH));
};

const getNormalizedCursor = (e, domElement) => {
  const rect = domElement.getBoundingClientRect();
  const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  return { ndcX, ndcY };
};

const calculatePanDelta = (camera, dx, dy, scale) => {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const right = new THREE.Vector3().copy(dir).cross(camera.up).normalize();
  const upScreen = new THREE.Vector3().copy(right).cross(dir).normalize();

  return new THREE.Vector3()
    .addScaledVector(right, -dx * scale)
    .addScaledVector(upScreen, dy * scale);
};

export function IsometricCamera({ width, height, margin = CAMERA_MARGIN, minZoom = DEFAULT_MIN_ZOOM, maxZoom = DEFAULT_MAX_ZOOM }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const targetX = width / 2;
    const targetZ = height / 2;
    const longest = Math.max(width, height);
    // позиционируем камеру по изометрии (равные компоненты X,Z и высота)
    const dist = longest * CAMERA_DISTANCE_FACTOR;
    camera.position.set(dist, dist, dist);
    camera.near = 0.1;
    camera.far = 2000;
    camera.lookAt(targetX, 0, targetZ);
    // подгоняем zoom так, чтобы вся карта влезала целиком с отступом
    // Для ортографической камеры видимые размеры мира ~ size.{width,height} / zoom
    const desiredWorldWidth = width * margin;
    const desiredWorldHeight = height * margin;
    const zoomByHeight = size.height / desiredWorldHeight;
    const zoomByWidth = size.width / desiredWorldWidth;
    const computedZoom = Math.min(zoomByHeight, zoomByWidth);
    // Клэмпим стартовый зум, чтобы он попадал в допустимые границы контролов
    camera.zoom = Math.max(minZoom, Math.min(maxZoom, computedZoom));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, width, height, margin, minZoom, maxZoom]);
  return null;
}

// Управление ортографической камерой: колесо — зум, панорамирование — левая кнопка
export function OrthoPanZoomControls({ minZoom = DEFAULT_MIN_ZOOM, maxZoom = DEFAULT_MAX_ZOOM, zoomSpeed = DEFAULT_ZOOM_SPEED }) {
  const { camera, gl, size } = useThree();
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef(new THREE.Vector3());

  // Инициализируем целевую точку камеры
  useEffect(() => {
    initializeCameraTarget(camera, targetRef);
  }, [camera]);

  const updateLookAt = useCallback(() => {
    camera.lookAt(targetRef.current);
  }, [camera]);

  // Масштаб: 1px в экранных координатах соответствует 1/camera.zoom мировых единиц
  const pixelToWorld = useCallback(() => 1 / camera.zoom, [camera.zoom]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? zoomSpeed : 1 / zoomSpeed;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom * factor));

    // Зум относительно курсора: смещаем target так, чтобы под курсором оставалась та же точка
    const { ndcX, ndcY } = getNormalizedCursor(e, gl.domElement);
    
    // Запоминаем точку мира под курсором до зума
    const worldPointBefore = calculateWorldPoint(camera, targetRef, size, ndcX, ndcY);

    // Применяем новый зум
    camera.zoom = newZoom;
    camera.updateProjectionMatrix();

    // Вычисляем точку мира под курсором после зума
    const worldPointAfter = calculateWorldPoint(camera, targetRef, size, ndcX, ndcY);

    // Сместим target так, чтобы worldPoint совпал
    const delta = new THREE.Vector3().subVectors(worldPointBefore, worldPointAfter);
    targetRef.current.add(delta);
    camera.position.add(delta);
    updateLookAt();
  }, [camera, gl.domElement, size, zoomSpeed, minZoom, maxZoom, updateLookAt]);

  const onPointerDown = useCallback((e) => {
    // панорамирование: левая кнопка мыши (удержание и перетаскивание)
    if (e.button === 0) {
      isPanningRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isPanningRef.current) return;
    
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    const scale = pixelToWorld();
    const delta = calculatePanDelta(camera, dx, dy, scale);

    targetRef.current.add(delta);
    camera.position.add(delta);
    updateLookAt();
  }, [camera, pixelToWorld, updateLookAt]);

  const onPointerUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    // отключаем контекстное меню, чтобы не мешало панорамированию правой кнопкой
    const onCtx = (e) => e.preventDefault();
    el.addEventListener('contextmenu', onCtx);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('contextmenu', onCtx);
    };
  }, [gl.domElement, onWheel, onPointerDown, onPointerMove, onPointerUp]);

  useFrame(() => {
    // держим «up» вертикально, исключая вращение камеры
    camera.up.set(0, 1, 0);
  });

  return null;
}

// PropTypes для валидации пропсов
IsometricCamera.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  margin: PropTypes.number,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number
};

OrthoPanZoomControls.propTypes = {
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  zoomSpeed: PropTypes.number
};
