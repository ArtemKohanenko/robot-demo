import Blockly from 'blockly';
import 'blockly/python';


Blockly.Blocks['move_forward'] = {
    init: function () {
        this.appendDummyInput()
        .appendField("Move forward on")
        .appendField(new Blockly.FieldNumber(1, 1, 100, 1), "CELLS")
        .appendField("steps");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip("Move agent forward");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['move_backward'] = {
    init: function () {
        this.appendDummyInput().appendField("Move Backward");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip("Move agent backward");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['turn_left'] = {
    init: function () {
        this.appendDummyInput().appendField("Turn Left");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(210);
        this.setTooltip("Turn agent left");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['turn_right'] = {
    init: function () {
        this.appendDummyInput().appendField("Turn Right");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(210);
        this.setTooltip("Turn agent right");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['pickup'] = {
    init: function () {
        this.appendDummyInput().appendField("Pick Up Cargo");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(210);
        this.setTooltip("Pick up cargo (green)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['dropoff'] = {
    init: function () {
        this.appendDummyInput().appendField("Drop Off Cargo");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(210);
        this.setTooltip("Drop off cargo (red)");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['wait'] = {
    init: function () {
        this.appendDummyInput()
        .appendField("Wait")
        .appendField(new Blockly.FieldNumber(1, 1, 100, 1), "SECONDS")
        .appendField("seconds");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(330);
        this.setTooltip("Wait some seconds");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['repeat_n_times'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Repeat")
            .appendField(new Blockly.FieldNumber(2, 1, 100, 1), "TIMES")
            .appendField("times");
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("do");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("Repeat the enclosed commands N times");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['if_then'] = {
    init: function () {
        this.appendValueInput("CONDITION")
            .setCheck("Boolean")
            .appendField("If");
        this.appendDummyInput()
            .appendField("then");
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(60);
        this.setTooltip("If condition is true, do commands");
        this.setHelpUrl("");
    }
};
