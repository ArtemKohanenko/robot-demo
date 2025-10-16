import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import React, { Suspense, useEffect, useRef, useCallback } from 'react'
import { AgentContext, agentControls } from '../state/agentContext'
import { useAgent } from './useAgent';
import { Map } from './Map'
import { useLevel } from '../state/levelContext'


function Agent({ x, y, radius, direction, scaleY = 1 }) {
  // Направление: 0 - вверх, 1 - вправо, 2 - вниз, 3 - влево
  // Для объёма вращаем вокруг оси Y (движение в XZ-плоскости)
  const rotationY = direction * (-Math.PI / 2) + Math.PI / 2;
  const size = radius * 2; // габарит по XZ
  const height = radius * 2; // высота по Y
  return (
    // Агент рендерится в XZ-плоскости (y — высота)
    <group position={[x, height / 2, y]} rotation={[0, rotationY, 0]} scale={[1, scaleY, 1]}>
      <mesh>
        <boxGeometry args={[size, height, size]} />
        <meshStandardMaterial color="#d9534f" />
      </mesh>
      {/* небольшой индикатор направления спереди */}
      <mesh position={[size * 0.6, 0, 0]}>
        <boxGeometry args={[size * 0.2, height * 0.2, size * 0.2]} />
        <meshStandardMaterial color="#f1c40f" />
      </mesh>
    </group>
  )
}

function IsometricCamera({ width, height, margin = 1.35, minZoom = 0.5, maxZoom = 200 }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const targetX = width / 2;
    const targetZ = height / 2;
    const longest = Math.max(width, height);
    // позиционируем камеру по изометрии (равные компоненты X,Z и высота)
    const dist = longest * 1.2;
    camera.position.set(dist, dist, dist);
    camera.near = 0.1;
    camera.far = 1000;
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

// Управление ортографической камерой: колесо — зум, панорамирование — правая кнопка
// или Shift+левая. Вращение отключено.
function OrthoPanZoomControls({ minZoom = 0.5, maxZoom = 200, zoomSpeed = 1.1 }) {
  const { camera, gl, size } = useThree();
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef(new THREE.Vector3());

  // Инициализируем целевую точку там, куда сейчас смотрит камера
  useEffect(() => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    // Цель — пересечение луча взгляда с плоскостью Y=0 (земля)
    // t из уравнения camera.position + dir * t, при условии y=0
    const t = -camera.position.y / dir.y;
    const look = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(t));
    if (Number.isFinite(look.x)) targetRef.current.copy(look);
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
    // Нормализуем координаты курсора в NDC [-1..1]
    const rect = gl.domElement.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    // Направления в мировых координатах для экранных осей
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const right = new THREE.Vector3().copy(dir).cross(camera.up).normalize();
    const upScreen = new THREE.Vector3().copy(right).cross(dir).normalize();

    // Текущая половина видимой ширины/высоты в мировых единицах
    const halfWorldW = (size.width / camera.zoom) / 2;
    const halfWorldH = (size.height / camera.zoom) / 2;
    const worldPointBefore = new THREE.Vector3()
      .copy(targetRef.current)
      .add(right.multiplyScalar(ndcX * halfWorldW))
      .add(upScreen.multiplyScalar(ndcY * halfWorldH));

    camera.zoom = newZoom;
    camera.updateProjectionMatrix();

    const halfWorldW2 = (size.width / camera.zoom) / 2;
    const halfWorldH2 = (size.height / camera.zoom) / 2;
    const dir2 = new THREE.Vector3();
    camera.getWorldDirection(dir2);
    const right2 = new THREE.Vector3().copy(dir2).cross(camera.up).normalize();
    const upScreen2 = new THREE.Vector3().copy(right2).cross(dir2).normalize();
    const worldPointAfter = new THREE.Vector3()
      .copy(targetRef.current)
      .add(right2.multiplyScalar(ndcX * halfWorldW2))
      .add(upScreen2.multiplyScalar(ndcY * halfWorldH2));

    // Сместим target так, чтобы worldPoint совпал
    const delta = new THREE.Vector3().subVectors(worldPointBefore, worldPointAfter);
    targetRef.current.add(delta);
    camera.position.add(delta);
    updateLookAt();
  }, [camera, gl.domElement, size.width, size.height, zoomSpeed, minZoom, maxZoom, updateLookAt]);

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
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const right = new THREE.Vector3().copy(dir).cross(camera.up).normalize();
    const upScreen = new THREE.Vector3().copy(right).cross(dir).normalize();

    const delta = new THREE.Vector3()
      .addScaledVector(right, -dx * scale)
      .addScaledVector(upScreen, dy * scale);

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

function SceneContent({ mapWidth, mapHeight, agentRadius, minZoom, maxZoom }) {
  const { grid, gridToWorld } = useLevel();
  const {
    agentState,
    agentControls: controlsFromHook
  } = useAgent({ mapWidth, mapHeight, agentRadius });

  // Прокидываем методы управления в глобальный объект
  Object.assign(agentControls, controlsFromHook);

  return (
    <AgentContext.Provider value={{ agentState }}>
      <Suspense fallback={<span>Загрузка...</span>}>
        <Canvas orthographic>
          {/* освещение для 3D-объектов */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <IsometricCamera width={mapWidth} height={mapHeight} minZoom={minZoom} maxZoom={maxZoom} />
          <OrthoPanZoomControls minZoom={minZoom} maxZoom={maxZoom} />
          <Map width={mapWidth} height={mapHeight} grid={grid} gridToWorld={gridToWorld} />
          {
            // Логические координаты теперь целочисленные индексы (i, j) в диапазонах
            // i: [0..mapWidth-1], j: [0..mapHeight-1]
            // Преобразуем в мировые координаты центра клетки:
            // worldX = i + 0.5, worldZ = (mapHeight - 1 - j) + 0.5
          }
          <Agent
            x={agentState.x + 0.5}
            y={(mapHeight - 1 - agentState.y) + 0.5}
            radius={agentRadius}
            direction={agentState.direction}
            scaleY={agentState.scaleY}
          />
        </Canvas>
      </Suspense>
    </AgentContext.Provider>
  );
}

export function Scene() {
  // Размеры карты должны совпадать с сеткой в Map (GRID_W x GRID_H)
  const mapWidth = 8;
  const mapHeight = 8;
  const agentRadius = 0.5;
  const minZoom = 0.5;
  const maxZoom = 200;

  return (
    <SceneContent 
      mapWidth={mapWidth} 
      mapHeight={mapHeight} 
      agentRadius={agentRadius} 
      minZoom={minZoom} 
      maxZoom={maxZoom} 
    />
  )
}
