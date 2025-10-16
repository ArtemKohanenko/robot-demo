import React from "react";
import * as THREE from "three";

export const GRID_W = 8;
export const GRID_H = 8;

const CELL_SIZE = 1.0;
const HALF = CELL_SIZE / 2;

export const CELL = {
  EMPTY: "empty",
  WALL: "wall",
  PICKUP: "pickup",
  DROPOFF: "dropoff",
};

export function makeInitialGrid() {
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



const LevelContext = React.createContext(null);

export function LevelProvider({ children }) {
  const [grid, setGrid] = React.useState(makeInitialGrid);

  // Утилиты, которые используют значения из контекста
  const contextUtils = {
    // Упрощенная версия gridToWorld
    gridToWorld: (x, y) => new THREE.Vector3(
      x * CELL_SIZE + HALF,
      0,
      (GRID_H - 1 - y) * CELL_SIZE + HALF
    ),
    
    // Упрощенная версия getCellType
    getCellType: (i, j) => {
      if (i < 0 || i >= GRID_W || j < 0 || j >= GRID_H) return null;
      return grid[j][i]?.type ?? null;
    },
    
    // Упрощенная версия isAdjacentToCellType
    isAdjacentToCellType: (i, j, type) => {
      const neighbors = [
        { i: i + 1, j },
        { i: i - 1, j },
        { i, j: j + 1 },
        { i, j: j - 1 }
      ];
      for (const { i: ni, j: nj } of neighbors) {
        if (ni < 0 || ni >= GRID_W || nj < 0 || nj >= GRID_H) continue;
        const cellType = grid[nj][ni]?.type ?? null;
        if (cellType === type) return true;
      }
      return false;
    },
    
    // Упрощенные версии isAdjacentToPickup и isAdjacentToDropoff
    isAdjacentToPickup: (i, j) => contextUtils.isAdjacentToCellType(i, j, CELL.PICKUP),
    isAdjacentToDropoff: (i, j) => contextUtils.isAdjacentToCellType(i, j, CELL.DROPOFF),
    
    // Упрощенная версия canEnterWorld
    canEnterWorld: (x, y) => {
      const i = Math.round(x + GRID_W / 2 - 0.5);
      const zCell = Math.round(y + GRID_H / 2 - 0.5);
      const j = GRID_H - 1 - zCell;
      if (i < 0 || i >= GRID_W || j < 0 || j >= GRID_H) return false;
      const cell = grid[j][i];
      return cell.type !== CELL.WALL;
    },
    
    // Упрощенная версия canEnterLogical
    canEnterLogical: (i, j) => {
      if (i < 0 || i >= GRID_W || j < 0 || j >= GRID_H) return false;
      const cell = grid[j][i];
      return cell.type !== CELL.WALL;
    },
    
    // Упрощенная версия isWallAt
    isWallAt: (i, j) => {
      if (i < 0 || i >= GRID_W || j < 0 || j >= GRID_H) return false;
      const cellType = grid[j][i]?.type ?? null;
      return cellType === CELL.WALL;
    }
  };

  const levelUtils = {
    ...contextUtils,
    CELL,
    CELL_SIZE,
    HALF
  };

  return (
    <LevelContext.Provider value={{ grid, setGrid, ...levelUtils }}>
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  const context = React.useContext(LevelContext);
  if (!context) {
    throw new Error("useLevel must be used within LevelProvider");
  }
  return context;
}


