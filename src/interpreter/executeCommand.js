export default function executeVirtualRobotCommand(cmd, agentControls) {
  let moveFn;
  switch (cmd) {
    case "MOVE_FORWARD":
      moveFn = agentControls.moveForward;
      break;
    case "MOVE_BACKWARD":
      moveFn = agentControls.moveBackward;
      break;
    case "TURN_RIGHT":
      moveFn = agentControls.turnRight;
      break;
    case "TURN_LEFT":
      moveFn = agentControls.turnLeft;
      break;
    default:
      moveFn = null;
  }
  if (!moveFn) {
    return Promise.reject(new Error("Unknown command: " + cmd));
  }

  return moveFn();
}