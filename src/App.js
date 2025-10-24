import { BlocklyWorkspace } from "react-blockly"
import "./App.css";
import "./blockly/customBlocks";
import { createGestureBlocks, getGestureBlockTypes } from "./blockly/customBlocks";
import RobotCommandGenerator, { registerGestureGenerators } from "./blockly/robotCommandGenerator";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Scene } from "./three/Scene";
import executeCommand from "./interpreter/executeCommand";
import { useCommandQueue } from "./interpreter/useCommandQueue";
import { LevelProvider, useLevel } from "./state/levelContext";
import { GestureProvider, useGesture } from "./state/gestureContext";
import Onboarding from "./components/Onboarding";
import { GestureDetector } from "./components/GestureDetector";
const baseFlyoutToolbox = {
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
    },
    {
      kind: "block",
      type: "if_gesture_then",
    }
  ],
};

function AppContent() {
  const workspaceRef = useRef(null);
  const { updateAlgorithmConfig, initAlgorithmConfig, isLevelCompleted } = useLevel();
  const { gestureState } = useGesture();
  const initXmlAlgorithmConfig = initAlgorithmConfig();

  const [gestureDetectorState, setGestureDetectorState] = useState({
    isActive: false,
    targetGesture: null,
    resolveGesture: null,
  });

  // Создаем gestureHandler для работы с жестами в executeCommand
  const gestureHandlerRef = useRef({
    waitForGesture: (targetGestureName) => {
      return new Promise((resolve) => {
        setGestureDetectorState({
          isActive: true,
          targetGesture: targetGestureName,
          resolveGesture: resolve,
        });
      });
    }
  });

  const gestureHandler = gestureHandlerRef.current;

  const handleGestureDetected = useCallback((detected) => {
    setGestureDetectorState(prev => {
      if (prev.resolveGesture) {
        prev.resolveGesture(detected);
      }
      return {
        isActive: false,
        targetGesture: null,
        resolveGesture: null,
      };
    });
  }, []);

  const handleCloseGestureDetector = useCallback(() => {
    setGestureDetectorState(prev => {
      if (prev.resolveGesture) {
        prev.resolveGesture(false);
      }
      return {
        isActive: false,
        targetGesture: null,
        resolveGesture: null,
      };
    });
  }, []);

  const [state, api] = useCommandQueue(executeCommand, gestureHandler);

  // Создаём toolbox с динамическими блоками жестов
  const flyoutToolbox = useMemo(() => {
    const toolbox = { ...baseFlyoutToolbox };
    
    if (gestureState.gestureClasses && gestureState.gestureClasses.length > 0) {
      // Создаём блоки для каждого жеста
      createGestureBlocks(gestureState.gestureClasses);
      registerGestureGenerators(gestureState.gestureClasses);
      
      // Добавляем блоки жестов в toolbox
      const gestureBlockTypes = getGestureBlockTypes(gestureState.gestureClasses);
      const gestureBlocks = gestureBlockTypes.map(type => ({
        kind: "block",
        type: type
      }));
      
      toolbox.contents = [...baseFlyoutToolbox.contents, ...gestureBlocks];
    }
    
    return toolbox;
  }, [gestureState.gestureClasses]);

  // Ключ для пересоздания workspace при изменении жестов
  const workspaceKey = useMemo(() => {
    return `workspace-${gestureState.gestureClasses.length}`;
  }, [gestureState.gestureClasses]);

  function workspaceDidChange(workspace) {
    workspaceRef.current = workspace;
  }

  return (
    <div className="flex-row full-size">
      <div className="flex-1 flex-col">
      <BlocklyWorkspace
          key={workspaceKey}
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
      {gestureDetectorState.isActive && (
        <GestureDetector
          targetGesture={gestureDetectorState.targetGesture}
          onGestureDetected={handleGestureDetected}
          onClose={handleCloseGestureDetector}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <GestureProvider>
      <LevelProvider>
        <AppContent />
      </LevelProvider>
    </GestureProvider>
  );
}
