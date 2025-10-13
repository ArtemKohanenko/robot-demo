import React, { createContext } from "react";

export const AgentContext = createContext(null);

export const agentControls = {
  moveForward: () => {},
  moveBackward: () => {},
  turnLeft: () => {},
  turnRight: () => {},
  getPos: () => ({ x: 0, y: 0, direction: 0 })
};
