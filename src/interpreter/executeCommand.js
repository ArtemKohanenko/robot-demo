export default function executeVirtualRobotCommand(cmd, agentControls) {
  const text = String(cmd).trim();

  const forwardMatch = text.match(/^MOVE_FORWARD\s+(\d+)\s*$/i);
  if (forwardMatch) {
    const steps = parseInt(forwardMatch[1], 10);
    if (!Number.isFinite(steps) || steps <= 0) {
      return Promise.reject(new Error("Invalid steps for MOVE_FORWARD: " + cmd));
    }
    return agentControls.moveForward(steps);
  }

  const waitMatch = text.match(/^WAIT\s+(\d+)\s*$/i);
  if (waitMatch) {
    const seconds = parseInt(waitMatch[1], 10);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return Promise.reject(new Error("Invalid seconds for WAIT: " + cmd));
    }
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  const commandMatchers = [
    { re: /^MOVE_BACKWARD\s*$/i, fn: agentControls.moveBackward },
    { re: /^TURN_RIGHT\s*$/i, fn: agentControls.turnRight },
    { re: /^TURN_LEFT\s*$/i, fn: agentControls.turnLeft },
    { re: /^PICKUP\s*$/i, fn: agentControls.pickUp },
    { re: /^DROPOFF\s*$/i, fn: agentControls.dropOff },
  ];

  for (const { re, fn } of commandMatchers) {
    if (re.test(text)) {
      return fn();
    }
  }

  return Promise.reject(new Error("Unknown command: " + cmd));
}