import { isWallAt } from "../three/Map";

const ifStack = [];

export default function executeVirtualRobotCommand(cmd, agentControls) {
  const text = String(cmd).trim();

  // Сперва обрабатываем управляющие конструкции IF/END_IF
  const ifMatch = text.match(/^IF\s+(.+)$/i);
  if (ifMatch) {
    const condition = ifMatch[1].trim();
    let result = false;
    if (/^IS_WALL_AHEAD\s*$/i.test(condition)) {
      const pos = agentControls.getPos();
      const dir = pos.direction;
      const dx = dir === 0 ? 0 : dir === 1 ? 1 : dir === 2 ? 0 : -1;
      const dy = dir === 0 ? 1 : dir === 1 ? 0 : dir === 2 ? -1 : 0;
      const i = Math.round(pos.x + dx);
      const j = Math.round(pos.y + dy);
      result = isWallAt(i, j);
    }
    ifStack.push(Boolean(result));
    return Promise.resolve();
  }

  if (/^END_IF\b/i.test(text)) {
    ifStack.pop();
    return Promise.resolve();
  }

  // Если текущая ветка ложная — игнорируем любые исполняемые команды
  if (ifStack.length > 0 && ifStack[ifStack.length - 1] === false) {
    return Promise.resolve();
  }

  const forwardMatch = text.match(/^MOVE_FORWARD\s+(\d+)\s*$/i);
  if (forwardMatch) {
    const steps = parseInt(forwardMatch[1], 10);
    if (!Number.isFinite(steps) || steps <= 0) {
      return Promise.reject(new Error("Invalid steps for MOVE_FORWARD: " + cmd));
    }
    return agentControls.moveForward(steps);
  }

  const backwardMatch = text.match(/^MOVE_BACKWARD\s+(\d+)\s*$/i);
  if (backwardMatch) {
    const steps = parseInt(backwardMatch[1], 10);
    if (!Number.isFinite(steps) || steps <= 0) {
      return Promise.reject(new Error("Invalid steps for MOVE_BACKWARD: " + cmd));
    }
    return agentControls.moveBackward(steps);
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