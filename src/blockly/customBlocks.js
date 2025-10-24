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
        this.appendDummyInput()
        .appendField("Move backward on")
        .appendField(new Blockly.FieldNumber(1, 1, 100, 1), "CELLS")
        .appendField("steps");
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

Blockly.Blocks['is_wall_ahead'] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Is wall ahead?");
        this.setInputsInline(false);
        this.setOutput(true, "Boolean");
        this.setColour(60);
        this.setTooltip("Returns true if there is a wall directly ahead");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['if_gesture_then'] = {
    init: function () {
        this.appendValueInput("GESTURE")
            .setCheck("Gesture")
            .appendField("If gesture");
        this.appendDummyInput()
            .appendField("then");
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Wait for gesture and execute commands when detected");
        this.setHelpUrl("");
    }
};

// Функция для создания блоков жестов динамически
export function createGestureBlocks(gestureClasses) {
    if (!gestureClasses || gestureClasses.length === 0) {
        return;
    }
    
    // Создаём отдельный блок для каждого жеста
    gestureClasses.forEach(gesture => {
        const blockType = `gesture_${gesture.id}_${gesture.name.replace(/\s+/g, '_')}`;
        
        Blockly.Blocks[blockType] = {
            init: function () {
                this.appendDummyInput()
                    .appendField(gesture.name);
                this.setInputsInline(false);
                this.setOutput(true, "Gesture");
                this.setColour(290);
                this.setTooltip(`Gesture: ${gesture.name}`);
                this.setHelpUrl("");
                // Сохраняем имя жеста в блоке
                this.gestureName = gesture.name;
            }
        };
    });
}

// Функция для получения списка типов блоков жестов
export function getGestureBlockTypes(gestureClasses) {
    if (!gestureClasses || gestureClasses.length === 0) {
        return [];
    }
    
    return gestureClasses.map(gesture => {
        return `gesture_${gesture.id}_${gesture.name.replace(/\s+/g, '_')}`;
    });
}
