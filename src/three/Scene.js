import { Canvas } from '@react-three/fiber'
import React, { Suspense } from 'react'
import { AgentContext, agentControls } from '../state/agentContext'
import { useAgent } from './useAgent';
import { Map } from './Map'


function Agent({ x, y, radius, direction }) {
  // Направление: 0 - вверх, 1 - вправо, 2 - вниз, 3 - влево
  // Поворот по z
  const rotation = direction * (-Math.PI / 2) + Math.PI / 2;
  return (
    // Агент рендерится в XZ-плоскости (y — высота)
    <mesh position={[x, 0.1, y]} rotation={[0, 0, rotation]}>
      <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial color="red" />
      <mesh position={[radius * 0.8, 0, 0.02]}>
        <circleGeometry args={[radius * 0.2, 16]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </mesh>
  )
}

export function Scene() {
  // Размеры карты должны совпадать с сеткой в Map (GRID_W x GRID_H)
  const mapWidth = 10;
  const mapHeight = 8;
  const agentRadius = 0.5;

  const {
    agentState,
    agentControls: controlsFromHook
  } = useAgent({ mapWidth, mapHeight, agentRadius });

  // Прокидываем методы управления в глобальный объект
  Object.assign(agentControls, controlsFromHook);

  return (
    <AgentContext.Provider value={{ agentState }}>
      <Suspense fallback={<span>Загрузка...</span>}>
        <Canvas orthographic camera={{ zoom: 50, position: [0, 0, 10] }}>
          <Map width={mapWidth} height={mapHeight} />
          {
            // Переносим координаты агента из системы [-w/2..w/2] в систему карты [0..w]
          }
          <Agent
            x={agentState.x + mapWidth / 2}
            y={agentState.y + mapHeight / 2}
            radius={agentRadius}
            direction={agentState.direction}
          />
        </Canvas>
      </Suspense>
    </AgentContext.Provider>
  )
}
