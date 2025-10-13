export default function executeCommands(commands, agentControls) {
  console.log("Executing commands:\n", commands);
  const queue = commands.split("\n").filter(Boolean);
  function runNext() {
    if (queue.length === 0) return;
    const cmd = queue.shift();
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
    if (moveFn) {
      const maybePromise = moveFn();
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(runNext);
      } else {
        setTimeout(runNext, 600);
      }
    } else {
      setTimeout(runNext, 0);
    }
  }
  runNext();
}