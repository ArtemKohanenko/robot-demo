import { CELL } from "../state/levelContext";

export const LEVEL_1_WIDTH = 8;
export const LEVEL_1_HEIGHT = 8;

export function getFirstLevelGrid() {
    const g = Array.from({ length: LEVEL_1_HEIGHT }, () =>
      Array.from({ length: LEVEL_1_WIDTH }, () => ({ type: CELL.EMPTY }))
    );
    g[2][3] = { type: CELL.WALL, meta: { height: 1.2 } };
    g[5][1] = { type: CELL.PICKUP, meta: { id: "P1" } };
    g[5][5] = { type: CELL.DROPOFF, meta: { id: "D1" } };
    g[7][2] = { type: CELL.WALL };
    g[0][4] = { type: CELL.WALL };
    g[3][7] = { type: CELL.WALL };
    return g;
  }
  