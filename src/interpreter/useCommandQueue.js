import React from 'react';
import { agentControls } from '../state/agentContext'

export function useCommandQueue(executor) {
  const [state, setState] = React.useState({
    queue: [],
    current: null,
    status: "idle",
    error: undefined,
  });

  const cancelCurrentRef = React.useRef(null);

  const enqueue = React.useCallback((cmd) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, cmd],
    }));
  }, []);

  const setQueue = React.useCallback((cmds) => {
    setState(prev => ({
      ...prev,
      queue: cmds
    }));
  }, []);

  const run = React.useCallback((cmds) => {
    setState(prev => ({
      ...prev,
      queue: cmds,
      status: "running",
    }));
  }, []);

  const start = React.useCallback(() => {
    setState(prev => {
      if (prev.status === "running") return prev;
      return { ...prev, status: "running" };
    });
  }, []);

  const pause = React.useCallback(() => {
    if (cancelCurrentRef.current) {
      cancelCurrentRef.current();
    }
    setState(prev => ({ ...prev, status: "paused" }));
  }, []);

  const resume = React.useCallback(() => {
    setState(prev => {
      if (prev.status === "paused") {
        return { ...prev, status: "running" };
      }
      return prev;
    });
  }, []);

  const stop = React.useCallback(() => {
    if (cancelCurrentRef.current) {
      cancelCurrentRef.current();
    }
    setState({
      queue: [],
      current: null,
      status: "idle",
      error: undefined,
    });
  }, []);

  // Queue processing
  React.useEffect(() => {
    if (state.status !== "running") return;
    if (state.current) return;
    if (state.queue.length === 0) {
      setState(prev => ({ ...prev, status: "idle" }));
      return;
    }

    const [next, ...rest] = state.queue;
    setState(prev => ({ ...prev, current: next, queue: rest }));

    let canceled = false;
    const cancelFunc = () => {
      canceled = true;
    };
    cancelCurrentRef.current = cancelFunc;

    executor(next, agentControls)
      .then(() => {
        if (canceled) return;
        cancelCurrentRef.current = null;
        setState(prev => ({ ...prev, current: null }));
      })
      .catch(err => {
        if (canceled) return;
        cancelCurrentRef.current = null;
        setState(prev => ({ ...prev, status: "error", error: err }));
      });
  }, [state, executor]);

  return [state, { enqueue, setQueue, start, pause, resume, stop, run }];
}
