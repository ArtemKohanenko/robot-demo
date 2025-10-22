import { useLoader } from '@react-three/fiber'
import React from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GRID_W, GRID_H, CELL } from '../state/levelContext';

const CELL_SIZE = 1.0;

// ====== Визуализация ======
function GridVisual({ grid, mapWidth = GRID_W, mapHeight = GRID_H, gridToWorld }) {
  const floorModel = useLoader(GLTFLoader, '/models/Floor.glb')
  const cells = [];
  for (let j = 0; j < mapHeight; j++) {
    for (let i = 0; i < mapWidth; i++) {
      const cell = grid[j][i];
      const world = gridToWorld(i, j);
      // базовая плитка
      cells.push(
        <primitive
          key={`tile-${i}-${j}`}
          object={floorModel.scene.clone()}
          position={[world.x, 0, world.z]}
        />
      );

      // отображаем объекты поверх плитки
      if (cell.type === CELL.WALL) {
        const h = (cell.meta && cell.meta.height) || 1.0;
        cells.push(
          <mesh key={`wall-${i}-${j}`} position={[world.x, h / 2, world.z]}>
            <boxGeometry args={[CELL_SIZE * 0.9, h, CELL_SIZE * 0.9]} />
            <meshStandardMaterial color="#8b5a3c" />
          </mesh>
        );
      } else if (cell.type === CELL.PICKUP) {
        const h = 0.12;
        const r = 0.35;
        cells.push(
          <mesh key={`pickup-${i}-${j}`} position={[world.x, h / 2, world.z]}>
            <cylinderGeometry args={[r, r, h, 24]} />
            <meshStandardMaterial color="#2ecc71" />
          </mesh>
        );
      } else if (cell.type === CELL.DROPOFF) {
        const h = 0.12;
        const r = 0.35;
        cells.push(
          <mesh key={`drop-${i}-${j}`} position={[world.x, h / 2, world.z]}>
            <cylinderGeometry args={[r, r, h, 24]} />
            <meshStandardMaterial color="#e76f51" />
          </mesh>
        );
      }
    }
  }
  return <group>{cells}</group>;
}
  
  

export function Map({ width, height, grid, gridToWorld }) {
  if (!grid || !Array.isArray(grid) || !grid[0]) {
    return null; // Можно заменить на <Loader />
  }

  const mapWidth = grid[0]?.length || GRID_W;
  const mapHeight = grid.length || GRID_H;

  return (
    <group>
      <GridVisual grid={grid} mapWidth={mapWidth} mapHeight={mapHeight} gridToWorld={gridToWorld} />
    </group>
  )
}
  