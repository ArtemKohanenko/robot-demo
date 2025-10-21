import { BlocklyWorkspace } from "react-blockly"
import "./App.css";
import "./blockly/customBlocks";
import { useRef } from "react";
import { Scene } from "./three/Scene";
import RobotCommandGenerator from "./blockly/robotCommandGenerator";
import executeCommand from "./interpreter/executeCommand";
import { useCommandQueue } from "./interpreter/useCommandQueue";
import { LevelProvider, useLevel } from "./state/levelContext";
import Onboarding from "./components/Onboarding";
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
      type: "pickup",
    },
    {
      kind: "block",
      type: "dropoff",
    },
    {
      kind: "block",
      type: "wait",
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
      type: "is_wall_ahead"
    }
  ],
};

function AppContent() {
  const workspaceRef = useRef(null);
  const { updateAlgorithmConfig, initAlgorithmConfig, isLevelCompleted } = useLevel();
  const initXmlAlgorithmConfig = initAlgorithmConfig();

  const [state, api] = useCommandQueue(executeCommand);

  function workspaceDidChange(workspace) {
    workspaceRef.current = workspace;
  }

  return (
    <div className="flex-row full-size">
      <div className="flex-1 flex-col">
      <BlocklyWorkspace
          key="flyout-only"
          toolboxConfiguration={flyoutToolbox}
          initialXml={initXmlAlgorithmConfig}
          onXmlChange={updateAlgorithmConfig}
          className="fill-height blockly-workspace-container"
          workspaceConfiguration={{
            renderer: 'thrasos',
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
        />
        <div className="horizontal-controls">
          
        </div>
      </div>
      <div className="scene-panel">
        <div className="scene-container">
          <Scene />
        </div>
        <button 
            className="executeButton"
            disabled={state.status === "running"}
            onClick={
              () => {
                const workspace = workspaceRef.current;
                const code = RobotCommandGenerator.workspaceToCode(workspace);
                const commands = code.split('\n')
                api.run(commands);
              }
          }>{state.status === "running" ? "Waiting..." : "Execute"}</button>
        <Onboarding isCompleted={isLevelCompleted} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LevelProvider>
      <AppContent />
    </LevelProvider>
  );
}
