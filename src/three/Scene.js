import { Canvas } from '@react-three/fiber'
import React, { useState, useRef } from 'react'
import { AgentContext, agentControls } from '../state/agentContext'
import { useAgent } from './useAgent';

function Map({ width, height }) {
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color="green" />
    </mesh>
  )
}

function Agent({ x, y, radius, direction }) {
  // Направление: 0 - вверх, 1 - вправо, 2 - вниз, 3 - влево
  // Поворот по z
  const rotation = direction * (-Math.PI / 2) + Math.PI / 2;
  return (
    <mesh position={[x, y, 0.1]} rotation={[0, 0, rotation]}>
      <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial color="red" />
      {/* Добавим "нос" агента */}
      <mesh position={[radius * 0.8, 0, 0.02]}>
        <circleGeometry args={[radius * 0.2, 16]} />
        <meshBasicMaterial color="yellow" />ы
      </mesh>
    </mesh>
  )
}

export function Scene() {
  const mapWidth = 10;
  const mapHeight = 6;
  const agentRadius = 0.5;

  const {
    agentState,
    agentControls: controlsFromHook
  } = useAgent({ mapWidth, mapHeight, agentRadius });

  // Прокидываем методы управления в глобальный объект
  Object.assign(agentControls, controlsFromHook);

  return (
    <AgentContext.Provider value={{ agentState }}>
      <Canvas orthographic camera={{ zoom: 50, position: [0, 0, 10] }}>
        <Map width={mapWidth} height={mapHeight} />
        <Agent x={agentState.x} y={agentState.y} radius={agentRadius} direction={agentState.direction} />
      </Canvas>
    </AgentContext.Provider>
  )
}
