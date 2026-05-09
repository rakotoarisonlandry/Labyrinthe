import { create } from 'zustand';
import { AgentPath, LiveSimulationState, Maze, createLiveSimulation, generateMaze, stepLiveSimulation } from './maze';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dynamicTargetSuccesses(size: number) {
  // 5 -> ~4, 10 -> ~7, 15 -> 10, 30 -> 10
  return clamp(Math.round(size * 0.7), 3, 10);
}

function dynamicMaxAgents(size: number, target: number) {
  // Hard caps by size so we never spawn "too many" agents.
  // Example requirement: 5x5 => max 4 agents.
  if (size <= 6) return clamp(target, 1, 4);
  if (size <= 8) return clamp(Math.max(target, 6), target, 8);
  if (size <= 12) return clamp(Math.max(target, 10), target, 14);
  if (size <= 20) return clamp(Math.max(target, 14), target, 24);
  return clamp(Math.max(target, 18), target, 32);
}

export interface MazeState {
  maze: Maze | null;
  agentPaths: AgentPath[];
  liveSim: LiveSimulationState | null;
  mazeSize: number;
  selectedAgentId: string | null;
  isGenerating: boolean;
  cameraRotation: { x: number; y: number };

  // Actions
  generateNewMaze: (size: number) => void;
  selectAgent: (agentId: string) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  tickSimulation: () => void;
  setCameraRotation: (x: number, y: number) => void;
}

export const useMazeStore = create<MazeState>((set) => ({
  maze: null,
  agentPaths: [],
  liveSim: null,
  mazeSize: 15,
  selectedAgentId: null,
  isGenerating: false,
  cameraRotation: { x: 0.4, y: 0.6 },

  generateNewMaze: (size: number) => {
    set({ isGenerating: true });
    setTimeout(() => {
      const maze = generateMaze(size, size);
      const target = dynamicTargetSuccesses(size);
      const maxAgents = dynamicMaxAgents(size, target);
      const liveSim = createLiveSimulation(maze, {
        targetSuccesses: target,
        maxAgents,
        maxStepsPerAgent: Math.max(size * size * 12, 250),
      });

      set({
        maze,
        mazeSize: size,
        agentPaths: [],
        liveSim,
        selectedAgentId: liveSim.agents[0]?.id ?? null,
        isGenerating: false,
      });
    }, 50);
  },

  selectAgent: (agentId) => {
    set({ selectedAgentId: agentId });
  },

  startSimulation: () => {
    set((state) => {
      if (!state.maze) return state;
      if (state.liveSim?.isRunning) return state;
      const target = dynamicTargetSuccesses(state.mazeSize);
      const maxAgents = dynamicMaxAgents(state.mazeSize, target);
      const liveSim = createLiveSimulation(state.maze, {
        targetSuccesses: target,
        maxAgents,
        maxStepsPerAgent: Math.max(state.mazeSize * state.mazeSize * 12, 250),
      });
      return {
        ...state,
        agentPaths: [],
        liveSim,
        selectedAgentId: liveSim.agents[0]?.id ?? null,
      };
    });
  },

  stopSimulation: () => {
    set((state) => ({
      ...state,
      liveSim: state.liveSim ? { ...state.liveSim, isRunning: false } : null,
    }));
  },

  tickSimulation: () => {
    set((state) => {
      if (!state.maze || !state.liveSim || !state.liveSim.isRunning) return state;
      const liveSim = stepLiveSimulation(state.maze, state.liveSim, Date.now());
      const agentPaths: AgentPath[] = liveSim.agents.map((a) => ({
        id: a.id,
        points: a.points,
        length: a.steps,
        turns: a.turns,
        complexite: a.turns,
        dangerousness: a.dangerousness,
        repetitiveness: a.repetitiveness,
        foundExit: a.foundExit,
      }));
      return { ...state, liveSim, agentPaths };
    });
  },

  setCameraRotation: (x: number, y: number) => {
    set({ cameraRotation: { x, y } });
  },
}));
