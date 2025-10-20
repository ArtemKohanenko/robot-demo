import React from "react";
import * as THREE from "three";
import { getLevelState, saveLevelState, deleteLevelState } from "../db/db";

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

function isEmptyXml(xmlConfig) {
  const trimmedXml = xmlConfig.trim();
  
  // Проверяем через regexp, что XML содержит только теги <xml></xml> без вложенных блоков
  // Разрешаем параметры в тегах, но не вложенные блоки
  const emptyXmlRegex = /^<xml[^>]*><\/xml>$/;
  
  return trimmedXml === '' || emptyXmlRegex.test(trimmedXml);
}

const LevelContext = React.createContext(null);

export function LevelProvider({ children, levelId = 1 }) {
  const [grid, setGrid] = React.useState(makeInitialGrid);
  const [isLoading, setIsLoading] = React.useState(true);
  const [xmlAlgorithmConfig, setXmlAlgorithmConfig] = React.useState('<xml></xml>');

  // Загрузка данных уровня из базы данных при инициализации
  React.useEffect(() => {
    const loadLevelData = async () => {
      try {
        setIsLoading(true);
        const levelData = await getLevelState(levelId);
        if (levelData) {
          if (levelData.gridJson) {
            setGrid(levelData.gridJson);
          }
          localStorage.getItem(`SavedAlgorithm/Level-${levelId}`);
          setXmlAlgorithmConfig(xmlAlgorithmConfig);
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных уровня:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLevelData();
  }, [levelId]);

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
    },

    // Сброс уровня к начальному состоянию
    resetLevel: async () => {
      try {
        await deleteLevelState(levelId);
        setGrid(makeInitialGrid());
        setXmlAlgorithmConfig('<xml></xml>');
        return true;
      } catch (error) {
        console.error("Ошибка при сбросе уровня:", error);
        return false;
      }
    },

    initAlgorithmConfig: () => {
      let levelId = localStorage.getItem(`CurrentLevel`);
      if (!levelId) {
        levelId = 1
        localStorage.setItem(`CurrentLevel`, 1);
      }
      
      let xmlConfig = localStorage.getItem(`SavedAlgorithm/Level-${levelId}`);
      if (!xmlConfig) {
        localStorage.setItem(`SavedAlgorithm/Level-${levelId}`, '<xml></xml>');
        xmlConfig = '<xml></xml>';
      }
      
      return xmlConfig;
    },

    updateAlgorithmConfig: (xmlConfig) => {
      let levelId = localStorage.getItem(`CurrentLevel`);
      if (!levelId) {
        return;
      }
      
      localStorage.setItem(`SavedAlgorithm/Level-${levelId}`, xmlConfig);
    }
  };

  const levelUtils = {
    ...contextUtils,
    CELL,
    CELL_SIZE,
    HALF
  };

  return (
    <LevelContext.Provider value={{ 
      grid, 
      setGrid, 
      xmlAlgorithmConfig,
      isLoading,
      levelId,
      ...levelUtils 
    }}>
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
