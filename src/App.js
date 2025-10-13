import "./App.css";
import "./blockly/customBlocks";
import { useState } from "react";

import { BlocklyWorkspace } from "react-blockly";
import { Scene } from "./3d/Scene";
import { agentControls } from "./3d/agentContext";
import RobotCommandGenerator from "./blockly/robotCommandGenerator";
import executeCommands from "./blockly/executeCommands";

export default function App() {
  const [xml, setXml] = useState("");
  const [commands, setCommands] = useState("");

  const initialXml = '<xml></xml>';
  // const toolboxCategories = {
  //   kind: "categoryToolbox",
  //   contents: [
  //     {
  //       kind: "category",
  //       name: "Move",
  //       colour: "#5C81A6",
  //       contents: [
  //         {
  //           kind: "block",
  //           type: "move_up",
  //         },
  //         {
  //           kind: "block",
  //           type: "move_right",
  //         },
  //         {
  //           kind: "block",
  //           type: "move_down",
  //         },
  //         {
  //           kind: "block",
  //           type: "move_left",
  //         },
  //       ],
  //     },
  //     {
  //       kind: "category",
  //       name: "Loops",
  //       colour: "#A65C81",
  //       contents: [
  //         {
  //           kind: "block",
  //           type: "repeat_n_times",
  //         },
  //       ],
  //     },
  //     {
  //       kind: "category",
  //       name: "Logic",
  //       colour: "#A6A65C",
  //       contents: [
  //         {
  //           kind: "block",
  //           type: "if_then",
  //         },
  //         {
  //           kind: "block",
  //           type: "random_number_1_10",
  //         },
  //         {
  //           kind: "block",
  //           type: "math_compare",
  //         },
  //         {
  //           kind: "block",
  //           type: "number_input",
  //         },
  //       ],
  //     },
  //     {
  //       kind: "category",
  //       name: "Rotate",
  //       colour: "#5CA65C",
  //       contents: [
  //         {
  //           kind: "block",
  //           type: "rotate_clockwise",
  //         },
  //         {
  //           kind: "block",
  //           type: "rotate_counterclockwise",
  //         },
  //       ],
  //     },
  //   ],
  // };
  const flyoutToolbox = {
    kind: "flyoutToolbox",
    contents: [
      {
        kind: "block",
        type: "move_forward",
      },
      {
        kind: "block",
        type: "move_backward",
      },
      {
        kind: "block",
        type: "turn_right",
      },
      {
        kind: "block",
        type: "turn_left",
      },
      {
        kind: "block",
        type: "repeat_n_times",
      },
      {
        kind: "block",
        type: "if_then",
      },
      {
        kind: "block",
        type: "random_number_1_10",
      },
      {
        kind: "block",
        type: "math_compare",
      },
      {
        kind: "block",
        type: "number_input",
      },
    ],
  };
  function workspaceDidChange(workspace) {
    // Используем наш генератор
    const code = RobotCommandGenerator.workspaceToCode(workspace);
    setCommands(code);
  }

  return (
    <div className="flex-row full-size">
      <div className="flex-1 flex-col">
        <BlocklyWorkspace
          key="flyout-only"
          toolboxConfiguration={flyoutToolbox}
          initialXml={initialXml}
          className="fill-height blockly-workspace-container"
          workspaceConfiguration={{
            grid: {
              spacing: 20,
              length: 3,
              colour: "#ccc",
              snap: true,
            },
            scrollbars: true,
            toolbox: {
              autoClose: false
            }
          }}
          onWorkspaceChange={workspaceDidChange}
          onXmlChange={setXml}
        />
        <div className="horizontal-controls">
          <textarea
            id="code"
            className="code-textarea"
            value={commands}
            readOnly
          ></textarea>
          <button onClick={() => executeCommands(commands, agentControls)}>Execute</button>
        </div>
      </div>
      <div className="scene-panel">
        <div className="scene-container">
          <Scene />
        </div>
      </div>
    </div>
  );
}
