import type { AgentPath } from './maze';

export interface DecisionCriteria {
  // Primary objectives (lower is better)
  distanceWeight: number; // length
  timeWeight: number; // approximated from length * stepMs
  turnWeight: number;
  dangerWeight: number;
  repeatWeight: number;

  // Domain knobs
  stepMs: number;
  baseMoveCost: number;
}

export interface DecisionResult {
  chosen: AgentPath | null;
  ranked: Array<{ agent: AgentPath; score: number }>;
}

export const DEFAULT_CRITERIA: DecisionCriteria = {
  distanceWeight: 1,
  timeWeight: 0.25,
  turnWeight: 0.6,
  dangerWeight: 0.9,
  repeatWeight: 0.8,
  stepMs: 520,
  baseMoveCost: 1,
};

export function scoreAgent(agent: AgentPath, criteria: DecisionCriteria): number {
  const time = agent.length * criteria.stepMs;
  const cost = agent.length * criteria.baseMoveCost;

  return (
    criteria.distanceWeight * agent.length +
    criteria.timeWeight * time +
    criteria.turnWeight * agent.turns +
    criteria.dangerWeight * agent.dangerousness +
    criteria.repeatWeight * agent.repetitiveness +
    0.02 * cost
  );
}

/**
 * Decide a UNIQUE best solution.
 * Tie-breakers guarantee uniqueness even when scores match:
 * score -> length -> turns -> dangerousness -> repetitiveness -> id
 */
export function decideUniqueBest(agents: AgentPath[], criteria: DecisionCriteria): DecisionResult {
  const successful = agents.filter((a) => a.foundExit);
  const ranked = successful
    .map((agent) => ({ agent, score: scoreAgent(agent, criteria) }))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.agent.length !== b.agent.length) return a.agent.length - b.agent.length;
      if (a.agent.turns !== b.agent.turns) return a.agent.turns - b.agent.turns;
      if (a.agent.dangerousness !== b.agent.dangerousness) return a.agent.dangerousness - b.agent.dangerousness;
      if (a.agent.repetitiveness !== b.agent.repetitiveness) return a.agent.repetitiveness - b.agent.repetitiveness;
      return a.agent.id.localeCompare(b.agent.id);
    });

  return { chosen: ranked[0]?.agent ?? null, ranked };
}

export interface AggregateStats {
  count: number;
  min: number;
  max: number;
  avg: number;
}

export function aggregate(values: number[]): AggregateStats {
  if (values.length === 0) return { count: 0, min: 0, max: 0, avg: 0 };
  let min = values[0];
  let max = values[0];
  let sum = 0;
  for (const v of values) {
    min = Math.min(min, v);
    max = Math.max(max, v);
    sum += v;
  }
  return { count: values.length, min, max, avg: sum / values.length };
}

