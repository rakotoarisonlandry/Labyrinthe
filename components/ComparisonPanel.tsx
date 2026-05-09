'use client';

import { useMazeStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { CheckCircle2, CornerDownRight, LoaderCircle, Repeat2, Route, Skull } from 'lucide-react';

export function ComparisonPanel() {
  const { agentPaths, maze, selectedAgentId, liveSim, selectAgent } = useMazeStore();

  if (!maze || agentPaths.length === 0) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Générez un labyrinthe pour voir les métriques</p>
          <p className="text-xs opacity-60 mt-2">Les parcours des agents seront analysés ici</p>
        </div>
      </Card>
    );
  }

  const selected = selectedAgentId
    ? agentPaths.find((a) => a.id === selectedAgentId) ?? agentPaths[0]
    : agentPaths[0];

  const successes = agentPaths.filter((a) => a.foundExit).length;
  const isFinished = !!liveSim && !liveSim.isRunning;
  const successfulAgents = agentPaths.filter((a) => a.foundExit);

  return (
    <div className="flex flex-col gap-4 h-full bg-gradient-to-b from-background to-card/50">
      {/* Header */}
      <div className="pt-6 px-6 border-b border-border/50">
        <h2 className="text-xl font-bold text-foreground mb-1">Analyse Multi-Agents</h2>
        <p className="text-xs text-muted-foreground">
          {successes}/{liveSim?.targetSuccesses ?? 10} agents ont trouvé la sortie • cliquez un agent à gauche pour le mettre en évidence
        </p>
      </div>

      {/* Metrics Cards */}
      <Card className="px-6 py-4 mx-6 flex-1 overflow-y-auto">
        <div className="space-y-4">
          {/* Selected agent quick stats */}
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-primary inline-flex items-center gap-2">
                {selected.foundExit ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <LoaderCircle className="w-4 h-4 text-muted-foreground/80" />
                )}
                {selected.id}
              </div>
              <div className="text-xs text-muted-foreground">
                {selected.foundExit ? 'Sortie atteinte' : 'En cours / arrêté'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-secondary/40 rounded p-3">
                <div className="text-muted-foreground">Longueur</div>
                <div className="text-base font-bold text-foreground inline-flex items-center gap-2">
                  <Route className="w-4 h-4 text-primary/80" />
                  {selected.length}
                </div>
              </div>
              <div className="bg-secondary/40 rounded p-3">
                <div className="text-muted-foreground">Complexité (virages)</div>
                <div className="text-base font-bold text-foreground inline-flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4 text-primary/80" />
                  {selected.turns}
                </div>
              </div>
              <div className="bg-secondary/40 rounded p-3">
                <div className="text-muted-foreground">Dangerosité (impasses évitées)</div>
                <div className="text-base font-bold text-foreground inline-flex items-center gap-2">
                  <Skull className="w-4 h-4 text-primary/80" />
                  {selected.dangerousness}
                </div>
              </div>
              <div className="bg-secondary/40 rounded p-3">
                <div className="text-muted-foreground">Répétitivité (retours)</div>
                <div className="text-base font-bold text-foreground inline-flex items-center gap-2">
                  <Repeat2 className="w-4 h-4 text-primary/80" />
                  {selected.repetitiveness}
                </div>
              </div>
            </div>
          </div>

          {/* List all agents */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-primary">Détail des 10 premiers agents</div>
            <div className="space-y-2">
              {agentPaths.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded border transition-all ${
                    a.id === selected.id ? 'border-primary/60 bg-primary/5' : 'border-border/50 bg-card/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">
                      <span className="inline-flex items-center gap-2">
                        {a.foundExit ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <LoaderCircle className="w-4 h-4 text-muted-foreground/80" />
                        )}
                        {a.id}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.length} pas • {a.turns} virages
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Impasses évitées: <span className="text-foreground font-semibold">{a.dangerousness}</span></div>
                    <div>Répétitions: <span className="text-foreground font-semibold">{a.repetitiveness}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finished: list successful agents */}
          {isFinished && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-primary">Agents arrivés</div>
              {successfulAgents.length === 0 ? (
                <div className="text-xs text-muted-foreground">Aucun agent n&apos;a atteint la sortie.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {successfulAgents.slice(0, 20).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => selectAgent(a.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                        a.id === selected.id
                          ? 'border-primary/60 bg-primary/10 text-primary'
                          : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {a.id}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
