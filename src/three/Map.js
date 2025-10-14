import * as THREE from "three";
import { useLoader } from '@react-three/fiber'
import React from 'react';


const GRID_W = 8;
const GRID_H = 8;
const CELL_SIZE = 1.0;
const HALF = CELL_SIZE / 2;

export const CELL_KINDS = {
    EMPTY: "empty",
    OBSTACLE: "obstacle",
    PICKUP: "pickup",
    DROPOFF: "dropoff",
};

const CELL = {
  EMPTY: "empty",
  WALL: "wall",
  PICKUP: "pickup",
  DROPOFF: "dropoff",
};

  

function gridToWorld(x, y) {
    // Инвертируем ось Y сетки по Z, чтобы (0,0) была внизу слева визуально
    return new THREE.Vector3(
      x * CELL_SIZE + HALF,
      0,
      (GRID_H - 1 - y) * CELL_SIZE + HALF
    );
  }

function makeInitialGrid() {
  const g = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => ({ type: CELL.EMPTY }))
  );

  g[2][3] = { type: CELL.WALL, meta: { height: 1.2 } };
  g[1][1] = { type: CELL.PICKUP, meta: { id: "P1" } };

  g[6][6] = { type: CELL.DROPOFF, meta: { id: "D1" } };

  g[7][2] = { type: CELL.WALL };
  g[0][4] = { type: CELL.WALL };
  g[3][7] = { type: CELL.WALL };

  return g;
}

// Единый статический грид для визуализации и коллизий
const STATIC_GRID = makeInitialGrid();

// Проверка: можно ли заехать в клетку по мировым координатам агента (логические X,Y)
export function canEnterWorld(x, y) {
  // Преобразуем мировые координаты центра клетки в индексы сетки
  const i = Math.round(x + GRID_W / 2 - 0.5);
  const zCell = Math.round(y + GRID_H / 2 - 0.5);
  const j = GRID_H - 1 - zCell; // инверсия по оси Z


  if (i < 0 || i >= GRID_W || j < 0 || j >= GRID_H) return false;
  const cell = STATIC_GRID[j][i];
  return cell.type !== CELL.WALL;
}

// Проверка возможности перемещения в логические координаты агента (мир useAgent)
// Вход: логические координаты агента в системе [-w/2..w/2] по X и Y
// Выход: true/false — можно ли войти в клетку (не выходит за границы и не стена)
export function canEnterLogical(i, j, mapWidth = GRID_W, mapHeight = GRID_H) {
  // Логические координаты теперь индексы сетки: i по X [0..mapWidth-1], j по Y [0..mapHeight-1]
  if (i < 0 || i >= mapWidth || j < 0 || j >= mapHeight) return false;
  const cell = STATIC_GRID[j][i];
  return cell.type !== CELL.WALL;
}

//

function GridVisual({ grid }) {
  const grassTexture = useLoader(THREE.TextureLoader, '/textures/cell.png')
    const cells = [];
    for (let j = 0; j < GRID_H; j++) {
      for (let i = 0; i < GRID_W; i++) {
        const cell = grid[j][i];
        const world = gridToWorld(i, j);
        // базовая плитка
        cells.push(
          <mesh
            key={`tile-${i}-${j}`}
            position={[world.x, 0, world.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
            <meshBasicMaterial
              map={grassTexture}
            />
          </mesh>
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
          // маркер пункта получения — зелёный цилиндр и метка
          cells.push(
            <group key={`pickup-${i}-${j}`} position={[world.x, 0.05, world.z]}>
              <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
              <meshStandardMaterial attach="material" color="#2ecc71" />
            </group>
          );
        } else if (cell.type === CELL.DROPOFF) {
          // маркер сдачи — конус / тор
          cells.push(
            <group key={`drop-${i}-${j}`} position={[world.x, 0.05, world.z]}>
              <coneGeometry args={[0.18, 0.25, 16]} />
              <meshStandardMaterial color="#e76f51" />
            </group>
          );
        }
      }
    }
    return <group>{cells}</group>;
}
  
  

export function Map({ width, height }) {
  const grid = React.useMemo(() => STATIC_GRID, []);

  return (
      <group>
          <GridVisual grid={grid} />
      </group>
  )
}
  