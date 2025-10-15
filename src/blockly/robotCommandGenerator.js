import Blockly from "blockly";

const RobotCommandGenerator = new Blockly.Generator("RobotCommandGenerator");
RobotCommandGenerator.ORDER_ATOMIC = 0;
RobotCommandGenerator["move_forward"] = function (block) {
  const cells = block.getFieldValue("CELLS");
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return `MOVE_FORWARD ${cells}\n` + next;
};
RobotCommandGenerator["move_backward"] = function (block) {
  const cells = block.getFieldValue("CELLS");
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return `MOVE_BACKWARD ${cells}\n` + next;
};
RobotCommandGenerator["turn_right"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "TURN_RIGHT\n" + next;
};

RobotCommandGenerator["turn_left"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "TURN_LEFT\n" + next;
};
RobotCommandGenerator["pickup"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "PICKUP\n" + next;
};
RobotCommandGenerator["dropoff"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "DROPOFF\n" + next;
};
RobotCommandGenerator["wait"] = function (block) {
  const seconds = block.getFieldValue("SECONDS");
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return `WAIT ${seconds}\n` + next;
};
RobotCommandGenerator["repeat_n_times"] = function (block) {
  const times = block.getFieldValue("TIMES");
  let branch = RobotCommandGenerator.statementToCode(block, "DO");
  if (branch) {
    branch = branch.split("\n").map((line) => line.trimStart()).join("\n");
  }
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  let code = "";
  for (let i = 0; i < times; i++) {
    code += branch;
    if (branch && !branch.endsWith("\n")) code += "\n";
  }
  return code + next;
};
RobotCommandGenerator["if_then"] = function (block) {
  const condition =
    RobotCommandGenerator.valueToCode(block, "CONDITION", RobotCommandGenerator.ORDER_ATOMIC) || "false";
  const branch = RobotCommandGenerator.statementToCode(block, "DO");
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  let code = "";
  code += `IF ${condition}\n`;
  code += branch;
  code += "END_IF\n";
  return code + next;
};
RobotCommandGenerator["is_wall_ahead"] = function (block) {
  return ["IS_WALL_AHEAD", RobotCommandGenerator.ORDER_ATOMIC];
};

export default RobotCommandGenerator;
