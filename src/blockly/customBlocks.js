import Blockly from 'blockly';
import 'blockly/python';


Blockly.Blocks['move_forward'] = {
    init: function () {
        this.appendDummyInput().appendField("Move Forward");
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

Blockly.Blocks['random_number_1_10'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Random number 1-10");
        this.setOutput(true, "Number");
        this.setColour(210);
        this.setTooltip("Generates a random number from 1 to 10");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['math_compare'] = {
    init: function () {
        this.appendValueInput("A")
            .setCheck("Number");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([["=", "EQ"], [">", "GT"], ["<", "LT"]]), "OPERATOR");
        this.appendValueInput("B")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(30);
        this.setTooltip("Compare two numbers");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['number_input'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(new Blockly.FieldNumber(0), "NUM");
        this.setOutput(true, "Number");
        this.setColour(200);
        this.setTooltip("Input a number");
        this.setHelpUrl("");
    }
};
