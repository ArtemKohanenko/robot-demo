import Blockly from "blockly";

const RobotCommandGenerator = new Blockly.Generator("RobotCommandGenerator");
RobotCommandGenerator.ORDER_ATOMIC = 0;
RobotCommandGenerator["move_forward"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "MOVE_FORWARD\n" + next;
};
RobotCommandGenerator["move_backward"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "MOVE_BACKWARD\n" + next;
};
RobotCommandGenerator["turn_right"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "TURN_RIGHT\n" + next;
};

RobotCommandGenerator["turn_left"] = function (block) {
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  return "TURN_LEFT\n" + next;
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
  const condition = RobotCommandGenerator.valueToCode(
    block,
    "CONDITION",
    RobotCommandGenerator.ORDER_ATOMIC
  ) || "false";
  const branch = RobotCommandGenerator.statementToCode(block, "DO");
  const next = RobotCommandGenerator.blockToCode(block.getNextBlock()) || "";
  let code = "";
  code += `IF ${condition}\n`;
  code += branch;
  code += "END_IF\n";
  return code + next;
};
RobotCommandGenerator["random_number_1_10"] = function (block) {
  return ["RANDOM_1_10", RobotCommandGenerator.ORDER_ATOMIC];
};
RobotCommandGenerator["math_compare"] = function (block) {
  const a = RobotCommandGenerator.valueToCode(
    block,
    "A",
    RobotCommandGenerator.ORDER_ATOMIC
  ) || "0";
  const b = RobotCommandGenerator.valueToCode(
    block,
    "B",
    RobotCommandGenerator.ORDER_ATOMIC
  ) || "0";
  const op = block.getFieldValue("OPERATOR");
  let opStr = "";
  if (op === "EQ") opStr = "=";
  else if (op === "GT") opStr = ">";
  else if (op === "LT") opStr = "<";
  return [`${a} ${opStr} ${b}`, RobotCommandGenerator.ORDER_ATOMIC];
};
RobotCommandGenerator["number_input"] = function (block) {
  return [String(block.getFieldValue("NUM")), RobotCommandGenerator.ORDER_ATOMIC];
};

export default RobotCommandGenerator;