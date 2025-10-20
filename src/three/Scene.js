import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import React, { Suspense, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { AgentContext, agentControls } from '../state/agentContext'
import { useAgent } from './useAgent';
import { Map } from './Map'
import { useLevel } from '../state/levelContext'
import { IsometricCamera, OrthoPanZoomControls, DEFAULT_MIN_ZOOM, DEFAULT_MAX_ZOOM } from './Camera'


// Константы карты по умолчанию  
const DEFAULT_MAP_WIDTH = 8;
const DEFAULT_MAP_HEIGHT = 8;
const DEFAULT_AGENT_RADIUS = 0.5;

// Компонент скайбокса
function Skybox() {
  const meshRef = useRef();
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/textures/sky_22_2k.png', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      if (meshRef.current) {
        meshRef.current.material.map = texture;
        meshRef.current.material.needsUpdate = true;
      }
    });
  }, []);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial side={THREE.BackSide} />
    </mesh>
  );
}


function Agent({ x, y, radius, direction, scaleY = 1, isMoving = false }) {
  const [model, setModel] = useState(null);
  const [mixer, setMixer] = useState(null);
  const [actions, setActions] = useState({});
  const groupRef = useRef();

  // Загрузка модели и анимаций
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/models/Fox.glb',
      (gltf) => {
        // Масштабируем модель так, чтобы её длина была 1 единица
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1 / maxDim; // 1 единица длины
        
        gltf.scene.scale.set(scale, scale, scale);
        
        // Центрируем модель
        box.setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.sub(center);
        
        setModel(gltf.scene);

        // Инициализируем анимации, если они есть
        if (gltf.animations && gltf.animations.length > 0) {
          const animMixer = new THREE.AnimationMixer(gltf.scene);
          const animActions = {};

          // Загружаем все анимации
          gltf.animations.forEach((clip) => {
            const action = animMixer.clipAction(clip);
            animActions[clip.name] = action;
          });

          setMixer(animMixer);
          setActions(animActions);

          console.log('Доступные анимации:', Object.keys(animActions));
        } else {
          console.warn('Анимации не найдены в модели Fox.glb');
        }
      },
      undefined,
      (error) => {
        console.error('Ошибка загрузки модели Fox.glb:', error);
      }
    );
  }, [radius]);

  // Управление анимациями в зависимости от состояния движения
  useEffect(() => {
    if (!mixer || Object.keys(actions).length === 0) return;

    // Ищем анимацию ходьбы/бега (обычно называется Walk, Run, или Survey)
    const walkAction = actions['Walk'] || actions['Run'] || actions['Survey'] || Object.values(actions)[0];

    if (isMoving) {
      // Включаем анимацию ходьбы
      walkAction?.fadeIn(0.2);
    } else {
      // Выключаем анимацию ходьбы
      walkAction?.fadeOut(0.2);
    }

    return () => {
      // Очистка при размонтировании
      walkAction?.stop();
    };
  }, [isMoving, mixer, actions]);

  // Обновляем mixer каждый кадр
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });

  // Направление: 0 - вверх, 1 - вправо, 2 - вниз, 3 - влево
  // Для объёма вращаем вокруг оси Y (движение в XZ-плоскости)
  const rotationY = direction * (-Math.PI / 2) + Math.PI / 2;
  const height = radius * 2;

  return (
    // Агент рендерится в XZ-плоскости (y — высота)
    <group ref={groupRef} position={[x, height / 2, y]} rotation={[0, rotationY, 0]} scale={[1, scaleY, 1]}>
      {model ? (
        // Внутренняя группа для коррекции ориентации модели
        // Math.PI/2 компенсирует поворот модели на 90° против часовой стрелки
        <group rotation={[0, Math.PI / 2, 0]}>
          <primitive object={model} />
        </group>
      ) : null}
    </group>
  );
}




function SceneContent({ mapWidth, mapHeight, agentRadius, minZoom, maxZoom }) {
  const { grid, gridToWorld } = useLevel();
  const {
    agentState,
    agentControls: controlsFromHook
  } = useAgent({ mapWidth, mapHeight, agentRadius });

  // Передаем и состояние агента, и его контролы через контекст
  const agentContextValue = {
    agentState,
    agentControls: controlsFromHook
  };

  // Для обратной совместимости с внешним кодом - синхронизируем глобальный объект
  // TODO: удалить когда весь код будет использовать контекст
  Object.assign(agentControls, controlsFromHook);

  return (
    <AgentContext.Provider value={agentContextValue}>
      <Suspense fallback={<span>Загрузка...</span>}>
        <Canvas orthographic>
          <Skybox />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
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
            isMoving={agentState.isMoving}
          />
        </Canvas>
      </Suspense>
    </AgentContext.Provider>
  );
}

export function Scene({ 
  mapWidth = DEFAULT_MAP_WIDTH, 
  mapHeight = DEFAULT_MAP_HEIGHT,
  agentRadius = DEFAULT_AGENT_RADIUS,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM
} = {}) {

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

// PropTypes для валидации пропсов
Agent.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  radius: PropTypes.number.isRequired,
  direction: PropTypes.number.isRequired,
  scaleY: PropTypes.number,
  isMoving: PropTypes.bool
};


SceneContent.propTypes = {
  mapWidth: PropTypes.number.isRequired,
  mapHeight: PropTypes.number.isRequired,
  agentRadius: PropTypes.number.isRequired,
  minZoom: PropTypes.number.isRequired,
  maxZoom: PropTypes.number.isRequired
};

Scene.propTypes = {
  mapWidth: PropTypes.number,
  mapHeight: PropTypes.number,
  agentRadius: PropTypes.number,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number
};
