/**
 * Maze generation using Prim's algorithm with perturbations
 * Produces organic, challenging mazes with multiple interesting paths
 */

export interface Cell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

export interface Maze {
  cells: Cell[][];
  width: number;
  height: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

type WallKey = keyof Cell['walls'];

/**
 * Generate maze using Prim's algorithm with perturbations
 */
export function generateMaze(width: number, height: number, seed?: number): Maze {
  const cells: Cell[][] = Array(height)
    .fill(null)
    .map((_, y) =>
      Array(width)
        .fill(null)
        .map((_, x) => ({
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
        }))
    );

  const visited = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  // Seeded random for reproducibility
  let seedVal = seed || Math.random() * 10000;
  const random = () => {
    seedVal = (seedVal * 9301 + 49297) % 233280;
    return seedVal / 233280;
  };

  // Start from top-left
  let x = 0,
    y = 0;
  visited[y][x] = true;
  const stack: Array<{ x: number; y: number }> = [{ x, y }];

  const directions: Array<{ dx: number; dy: number; wall: WallKey }> = [
    { dx: 0, dy: -1, wall: 'top' },
    { dx: 1, dy: 0, wall: 'right' },
    { dx: 0, dy: 1, wall: 'bottom' },
    { dx: -1, dy: 0, wall: 'left' },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: typeof directions = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
        neighbors.push(dir);
      }
    }

    if (neighbors.length > 0) {
      const dir = neighbors[Math.floor(random() * neighbors.length)];
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;

      // Remove wall
      const oppositeWalls = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' } as const;
      cells[current.y][current.x].walls[dir.wall] = false;
      cells[ny][nx].walls[oppositeWalls[dir.wall]] = false;

      visited[ny][nx] = true;
      stack.push({ x: nx, y: ny });
    } else {
      stack.pop();
    }
  }

  // Add perturbations (randomly remove some walls) for more complex paths
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (random() < 0.05) {
        const dirs = [
          { wall: 'right' as const, dx: 1, dy: 0 },
          { wall: 'bottom' as const, dx: 0, dy: 1 },
        ];
        const dir = dirs[Math.floor(random() * dirs.length)];
        const nx = x + dir.dx;
        const ny = y + dir.dy;

        if (nx < width && ny < height) {
          cells[y][x].walls[dir.wall] = false;
          const oppositeWalls = { right: 'left', bottom: 'top' } as const;
          cells[ny][nx].walls[oppositeWalls[dir.wall]] = false;
        }
      }
    }
  }

  return {
    cells,
    width,
    height,
    start: { x: 0, y: 0 },
    end: { x: width - 1, y: height - 1 },
  };
}

/**
 * Path finding with different algorithms
 */
export interface Path {
  points: Array<{ x: number; y: number }>;
  length: number;
  turns: number;
  dangerousness: number; // Number of times the agent passed near a dead-end
  repetitiveness: number; // Number of revisits (stepping again on an already visited cell)
  efficiency: number; // Path length vs direct distance
  straightness: number; // How straight is the path
  exploration: number; // How much of maze was explored
}

export interface AgentSimulationOptions {
  /**
   * Stop the simulation once this many agents found the exit.
   */
  targetSuccesses?: number;
  /**
   * Maximum number of agents to launch (upper bound).
   */
  maxAgents?: number;
  /**
   * Hard stop to avoid infinite wandering.
   */
  maxStepsPerAgent?: number;
  /**
   * Optional seed for reproducible randomness.
   */
  seed?: number;
}

export interface AgentPath {
  id: string;
  points: Array<{ x: number; y: number }>;
  length: number;
  turns: number;
  complexite: number; // alias for turns (FR-friendly name)
  dangerousness: number;
  repetitiveness: number;
  foundExit: boolean;
}

export interface LiveAgentState {
  id: string;
  current: { x: number; y: number };
  prev: { x: number; y: number } | null;
  points: Array<{ x: number; y: number }>;
  visited: Record<string, boolean>;
  steps: number;
  turns: number;
  dangerousness: number;
  repetitiveness: number;
  foundExit: boolean;
  stopped: boolean;
  spawned: boolean;
  spawnTick: number;
  rngSeed: number;
}

export interface LiveSimulationState {
  seed: number;
  targetSuccesses: number;
  maxAgents: number;
  maxStepsPerAgent: number;
  successes: number;
  agents: LiveAgentState[];
  isRunning: boolean;
  tick: number;
  lastTickAtMs: number;
}

export function createLiveSimulation(maze: Maze, options: AgentSimulationOptions = {}): LiveSimulationState {
  const targetSuccesses = Math.max(1, options.targetSuccesses ?? 10);
  const maxAgents = Math.max(targetSuccesses, options.maxAgents ?? 60);
  const maxStepsPerAgent = options.maxStepsPerAgent ?? Math.max(maze.width * maze.height * 12, 200);
  const seed = options.seed ?? Math.floor(Math.random() * 1_000_000);

  const agents: LiveAgentState[] = Array.from({ length: maxAgents }, (_, idx) => {
    const id = `agent-${idx + 1}`;
    const start = { ...maze.start };
    // spawn agents progressively so they're visible leaving the entrance one by one
    const spawnTick = idx * 2;
    const rngSeed = (seed + (idx + 1) * 9973) % 233280;
    return {
      id,
      current: start,
      prev: null,
      points: [start],
      visited: { [`${start.x},${start.y}`]: true },
      steps: 0,
      turns: 0,
      dangerousness: 0,
      repetitiveness: 0,
      foundExit: false,
      stopped: false,
      spawned: idx === 0,
      spawnTick,
      rngSeed,
    };
  });

  return {
    seed,
    targetSuccesses,
    maxAgents,
    maxStepsPerAgent,
    successes: 0,
    agents,
    isRunning: true,
    tick: 0,
    lastTickAtMs: Date.now(),
  };
}

export function stepLiveSimulation(maze: Maze, sim: LiveSimulationState, nowMs: number): LiveSimulationState {
  if (!sim.isRunning) return sim;

  let successes = sim.successes;
  const currentTick = sim.tick + 1;

  const agents = sim.agents.map((a) => {
    if (a.stopped) return a;
    if (successes >= sim.targetSuccesses) return { ...a, stopped: true };
    if (a.steps >= sim.maxStepsPerAgent) return { ...a, stopped: true };
    if (a.current.x === maze.end.x && a.current.y === maze.end.y) return { ...a, foundExit: true, stopped: true };

    if (!a.spawned) {
      if (currentTick < a.spawnTick) return a;
      // "enter" the maze from just outside the start cell for nicer visualization
      const enteringPrev = { x: maze.start.x - 1, y: maze.start.y };
      return {
        ...a,
        spawned: true,
        prev: enteringPrev,
        current: { ...maze.start },
        points: [{ ...maze.start }],
        visited: { [`${maze.start.x},${maze.start.y}`]: true },
      };
    }

    // agent-specific RNG to reduce duplicates and ensure uniqueness in behavior
    let seedVal = a.rngSeed;
    const random = () => {
      seedVal = (seedVal * 9301 + 49297) % 233280;
      return seedVal / 233280;
    };

    const allOptions = neighborsOf(maze, a.current);
    if (allOptions.length === 0) return { ...a, stopped: true };

    let options = allOptions;
    if (a.prev && allOptions.length > 1) {
      const filtered = allOptions.filter((n) => !samePos(n, a.prev));
      if (filtered.length > 0) options = filtered;
    }

    const next = options[Math.floor(random() * options.length)];

    let dangerousness = a.dangerousness;
    if (options.length >= 2) {
      const hasDeadEndOption = options.some((p) => isDeadEndCell(maze, p));
      const choseDeadEnd = isDeadEndCell(maze, next);
      if (hasDeadEndOption && !choseDeadEnd) dangerousness++;
    }

    const prev = a.current;
    const current = next;
    const points = [...a.points, current];

    const k = `${current.x},${current.y}`;
    const repetitiveness = a.repetitiveness + (a.visited[k] ? 1 : 0);
    const visited = a.visited[k] ? a.visited : { ...a.visited, [k]: true };

    // Update turns incrementally based on last two moves
    let turns = a.turns;
    if (a.points.length >= 2) {
      const p0 = a.points[a.points.length - 2];
      const p1 = a.points[a.points.length - 1];
      const dx1 = p1.x - p0.x;
      const dy1 = p1.y - p0.y;
      const dx2 = current.x - p1.x;
      const dy2 = current.y - p1.y;
      if (dx1 !== dx2 || dy1 !== dy2) turns++;
    }

    const foundExit = current.x === maze.end.x && current.y === maze.end.y;
    const stopped = foundExit ? true : false;
    if (foundExit) successes++;

    return {
      ...a,
      prev,
      current,
      points,
      visited,
      steps: a.steps + 1,
      turns,
      dangerousness,
      repetitiveness,
      foundExit,
      stopped,
      rngSeed: seedVal,
    };
  });

  const isRunning = successes < sim.targetSuccesses && agents.some((a) => !a.stopped);

  return {
    ...sim,
    successes,
    agents,
    isRunning,
    tick: currentTick,
    lastTickAtMs: nowMs,
  };
}

/**
 * BFS pathfinding - shortest path
 */
export function pathfindBFS(maze: Maze): Path {
  const { start, end, width, height } = maze;
  const queue: Array<{ x: number; y: number; parent: any }> = [{ ...start, parent: null }];
  const visited = new Map<string, { x: number; y: number }>();
  visited.set(`${start.x},${start.y}`, null as any);

  const key = (x: number, y: number) => `${x},${y}`;
  let explored = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    explored++;

    if (current.x === end.x && current.y === end.y) {
      // Reconstruct path
      const points: Array<{ x: number; y: number }> = [];
      let node: any = current;
      while (node) {
        points.unshift({ x: node.x, y: node.y });
        node = visited.get(key(node.x, node.y));
      }

      const turns = calculateTurns(points);
      const directDist = Math.hypot(end.x - start.x, end.y - start.y);
      const pathDist = points.length - 1;

      return {
        points,
        length: pathDist,
        turns,
        dangerousness: 0,
        repetitiveness: 0,
        efficiency: directDist / pathDist,
        straightness: 1 - turns / pathDist,
        exploration: explored / (width * height),
      };
    }

    const cell = maze.cells[current.y][current.x];
    const neighbors = [];

    if (!cell.walls.top && current.y > 0) neighbors.push({ x: current.x, y: current.y - 1 });
    if (!cell.walls.right && current.x < width - 1) neighbors.push({ x: current.x + 1, y: current.y });
    if (!cell.walls.bottom && current.y < height - 1) neighbors.push({ x: current.x, y: current.y + 1 });
    if (!cell.walls.left && current.x > 0) neighbors.push({ x: current.x - 1, y: current.y });

    for (const neighbor of neighbors) {
      if (!visited.has(key(neighbor.x, neighbor.y))) {
        visited.set(key(neighbor.x, neighbor.y), current);
        queue.push({ ...neighbor, parent: current });
      }
    }
  }

  return { points: [start], length: 0, turns: 0, dangerousness: 0, repetitiveness: 0, efficiency: 0, straightness: 0, exploration: explored / (width * height) };
}

/**
 * DFS pathfinding - exploratory path
 */
export function pathfindDFS(maze: Maze): Path {
  const { start, end, width, height } = maze;
  const stack: Array<{ x: number; y: number; parent: any }> = [{ ...start, parent: null }];
  const visited = new Map<string, { x: number; y: number }>();
  visited.set(`${start.x},${start.y}`, null as any);

  const key = (x: number, y: number) => `${x},${y}`;
  let explored = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    explored++;

    if (current.x === end.x && current.y === end.y) {
      const points: Array<{ x: number; y: number }> = [];
      let node: any = current;
      while (node) {
        points.unshift({ x: node.x, y: node.y });
        node = visited.get(key(node.x, node.y));
      }

      const turns = calculateTurns(points);
      const directDist = Math.hypot(end.x - start.x, end.y - start.y);
      const pathDist = points.length - 1;

      return {
        points,
        length: pathDist,
        turns,
        dangerousness: 0,
        repetitiveness: calculateRepetitivenessCount(points),
        efficiency: directDist / pathDist,
        straightness: 1 - turns / pathDist,
        exploration: explored / (width * height),
      };
    }

    const cell = maze.cells[current.y][current.x];
    const neighbors = [];

    if (!cell.walls.top && current.y > 0) neighbors.push({ x: current.x, y: current.y - 1 });
    if (!cell.walls.right && current.x < width - 1) neighbors.push({ x: current.x + 1, y: current.y });
    if (!cell.walls.bottom && current.y < height - 1) neighbors.push({ x: current.x, y: current.y + 1 });
    if (!cell.walls.left && current.x > 0) neighbors.push({ x: current.x - 1, y: current.y });

    for (const neighbor of neighbors) {
      if (!visited.has(key(neighbor.x, neighbor.y))) {
        visited.set(key(neighbor.x, neighbor.y), current);
        stack.push({ ...neighbor, parent: current });
      }
    }
  }

  return { points: [start], length: 0, turns: 0, dangerousness: 0, repetitiveness: 0, efficiency: 0, straightness: 0, exploration: explored / (width * height) };
}

/**
 * Greedy pathfinding - aggressive towards goal
 */
export function pathfindGreedy(maze: Maze): Path {
  const { start, end, width, height } = maze;
  const visited = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const points: Array<{ x: number; y: number }> = [start];
  const parent = new Map<string, { x: number; y: number }>();

  let current = start;
  let explored = 0;

  while (current.x !== end.x || current.y !== end.y) {
    visited.add(key(current.x, current.y));
    const cell = maze.cells[current.y][current.x];

    const neighbors = [];
    if (!cell.walls.top && current.y > 0) neighbors.push({ x: current.x, y: current.y - 1 });
    if (!cell.walls.right && current.x < width - 1) neighbors.push({ x: current.x + 1, y: current.y });
    if (!cell.walls.bottom && current.y < height - 1) neighbors.push({ x: current.x, y: current.y + 1 });
    if (!cell.walls.left && current.x > 0) neighbors.push({ x: current.x - 1, y: current.y });

    let best = neighbors[0];
    let bestDist = Math.hypot(best.x - end.x, best.y - end.y);

    for (const neighbor of neighbors) {
      if (!visited.has(key(neighbor.x, neighbor.y))) {
        const dist = Math.hypot(neighbor.x - end.x, neighbor.y - end.y);
        if (dist < bestDist) {
          best = neighbor;
          bestDist = dist;
        }
      }
    }

    if (visited.has(key(best.x, best.y))) break;

    current = best;
    points.push(current);
    explored++;
  }

  const turns = calculateTurns(points);
  const directDist = Math.hypot(end.x - start.x, end.y - start.y);
  const pathDist = points.length - 1;

  return {
    points,
    length: pathDist,
    turns,
    dangerousness: 0,
    repetitiveness: 0,
    efficiency: directDist / pathDist,
    straightness: 1 - turns / pathDist,
    exploration: explored / (width * height),
  };
}

/**
 * Multi-agent random exploration from start to end.
 *
 * Each agent:
 * - Lists possible moves (up/down/left/right) from current cell
 * - Picks a random direction
 * - Avoids immediate backtracking (short memory = cannot return to previous cell),
 *   unless it's the only available move (dead-end).
 *
 * Simulation stops when `targetSuccesses` agents reached the exit (or maxAgents).
 */
export function simulateRandomAgents(maze: Maze, options: AgentSimulationOptions = {}): AgentPath[] {
  const targetSuccesses = Math.max(1, options.targetSuccesses ?? 10);
  const maxAgents = Math.max(targetSuccesses, options.maxAgents ?? 60);
  const maxStepsPerAgent =
    options.maxStepsPerAgent ?? Math.max(maze.width * maze.height * 12, 200);

  let seedVal = options.seed ?? Math.floor(Math.random() * 1_000_000);
  const random = () => {
    // LCG (same spirit as maze generation)
    seedVal = (seedVal * 9301 + 49297) % 233280;
    return seedVal / 233280;
  };

  const results: AgentPath[] = [];
  let successes = 0;

  for (let agentIdx = 0; agentIdx < maxAgents && successes < targetSuccesses; agentIdx++) {
    const agentId = `agent-${agentIdx + 1}`;
    const run = simulateSingleAgent(maze, { random, maxSteps: maxStepsPerAgent });
    results.push({
      id: agentId,
      points: run.points,
      length: run.length,
      turns: run.turns,
      complexite: run.turns,
      dangerousness: run.dangerousness,
      repetitiveness: run.repetitiveness,
      foundExit: run.foundExit,
    });
    if (run.foundExit) successes++;
  }

  // Prefer showing successful paths first (user asked to stop after X exits found)
  results.sort((a, b) => Number(b.foundExit) - Number(a.foundExit));
  return results;
}

function calculateTurns(points: Array<{ x: number; y: number }>): number {
  if (points.length < 3) return 0;
  let turns = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dx1 = points[i].x - points[i - 1].x;
    const dy1 = points[i].y - points[i - 1].y;
    const dx2 = points[i + 1].x - points[i].x;
    const dy2 = points[i + 1].y - points[i].y;

    if (dx1 !== dx2 || dy1 !== dy2) {
      turns++;
    }
  }

  return turns;
}

function calculateRepetitivenessCount(points: Array<{ x: number; y: number }>): number {
  const visited = new Set<string>();
  let revisits = 0;

  for (const point of points) {
    const k = `${point.x},${point.y}`;
    if (visited.has(k)) revisits++;
    visited.add(k);
  }

  return revisits;
}

function neighborsOf(maze: Maze, pos: { x: number; y: number }): Array<{ x: number; y: number }> {
  const { width, height } = maze;
  const cell = maze.cells[pos.y][pos.x];
  const neighbors: Array<{ x: number; y: number }> = [];
  if (!cell.walls.top && pos.y > 0) neighbors.push({ x: pos.x, y: pos.y - 1 });
  if (!cell.walls.right && pos.x < width - 1) neighbors.push({ x: pos.x + 1, y: pos.y });
  if (!cell.walls.bottom && pos.y < height - 1) neighbors.push({ x: pos.x, y: pos.y + 1 });
  if (!cell.walls.left && pos.x > 0) neighbors.push({ x: pos.x - 1, y: pos.y });
  return neighbors;
}

function isDeadEndCell(maze: Maze, pos: { x: number; y: number }): boolean {
  // A dead-end (cul-de-sac) is a cell with only one accessible neighbor.
  return neighborsOf(maze, pos).length <= 1;
}

function samePos(a: { x: number; y: number } | null, b: { x: number; y: number } | null): boolean {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

function simulateSingleAgent(
  maze: Maze,
  params: { random: () => number; maxSteps: number }
): { points: Array<{ x: number; y: number }>; length: number; turns: number; dangerousness: number; repetitiveness: number; foundExit: boolean } {
  const points: Array<{ x: number; y: number }> = [{ ...maze.start }];
  const visited = new Set<string>([`${maze.start.x},${maze.start.y}`]);

  let current = { ...maze.start };
  let prev: { x: number; y: number } | null = null;

  let dangerousness = 0;
  let revisits = 0;

  for (let step = 0; step < params.maxSteps; step++) {
    if (current.x === maze.end.x && current.y === maze.end.y) {
      break;
    }

    const allOptions = neighborsOf(maze, current);
    if (allOptions.length === 0) break;

    // "Short memory": avoid immediate backtracking if we have alternatives.
    let options = allOptions;
    if (prev && allOptions.length > 1) {
      const filtered = allOptions.filter((n) => !samePos(n, prev));
      if (filtered.length > 0) options = filtered;
    }

    const next = options[Math.floor(params.random() * options.length)];

    // Dangerosity: if at a true choice point (>=2 options) and there exists at least one dead-end option
    // but the chosen move is NOT into a dead-end, count "passed near" an impasse.
    if (options.length >= 2) {
      const hasDeadEndOption = options.some((p) => isDeadEndCell(maze, p));
      const choseDeadEnd = isDeadEndCell(maze, next);
      if (hasDeadEndOption && !choseDeadEnd) dangerousness++;
    }

    prev = current;
    current = next;
    points.push(current);

    const k = `${current.x},${current.y}`;
    if (visited.has(k)) revisits++;
    visited.add(k);
  }

  const foundExit = current.x === maze.end.x && current.y === maze.end.y;
  const turns = calculateTurns(points);

  return {
    points,
    length: Math.max(0, points.length - 1),
    turns,
    dangerousness,
    repetitiveness: revisits,
    foundExit,
  };
}
