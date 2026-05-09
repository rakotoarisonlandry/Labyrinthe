'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMazeStore } from '@/lib/store';
import { DEFAULT_CRITERIA, decideUniqueBest, type DecisionCriteria, aggregate } from '@/lib/decision';
import { ArrowLeft, Crown, Filter, Gauge, Route, SlidersHorizontal } from 'lucide-react';
import { MazeVisualization } from '@/components/MazeVisualization';

function NumberField({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full rounded-md bg-secondary/40 border border-border/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

export default function DecisionPage() {
  const { maze, agentPaths, selectAgent } = useMazeStore();
  const [criteria, setCriteria] = useState<DecisionCriteria>(DEFAULT_CRITERIA);

  const successful = useMemo(() => agentPaths.filter((a) => a.foundExit), [agentPaths]);
  const decision = useMemo(() => decideUniqueBest(agentPaths, criteria), [agentPaths, criteria]);

  useEffect(() => {
    if (decision.chosen) selectAgent(decision.chosen.id);
  }, [decision.chosen?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const lengths = successful.map((a) => a.length);
    const turns = successful.map((a) => a.turns);
    const danger = successful.map((a) => a.dangerousness);
    const repeat = successful.map((a) => a.repetitiveness);
    return {
      length: aggregate(lengths),
      turns: aggregate(turns),
      danger: aggregate(danger),
      repeat: aggregate(repeat),
    };
  }, [successful]);

  if (!maze) {
    return (
      <main className="min-h-screen bg-background text-foreground p-8">
        <Card className="p-6 max-w-xl mx-auto">
          <div className="text-sm text-muted-foreground">Aucun labyrinthe chargé.</div>
          <div className="mt-4">
            <Link href="/" className="text-primary underline underline-offset-4">
              Retour
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="h-screen bg-background text-foreground overflow-hidden">
      <div className="h-full grid grid-cols-[360px_1fr_420px]">
        {/* Left: criteria */}
        <aside className="border-r border-border/50 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <SlidersHorizontal className="w-4 h-4" />
                Décideur
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xl font-bold text-foreground">Choix de la solution unique</div>
              <div className="text-xs text-muted-foreground">
                Basé sur distance/temps/coût — tie-breakers garantissent 1 seule solution.
              </div>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Filter className="w-4 h-4 text-primary/80" />
                Critères
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Distance" value={criteria.distanceWeight} onChange={(v) => setCriteria((c) => ({ ...c, distanceWeight: v }))} />
                <NumberField label="Temps" value={criteria.timeWeight} onChange={(v) => setCriteria((c) => ({ ...c, timeWeight: v }))} />
                <NumberField label="Virages" value={criteria.turnWeight} onChange={(v) => setCriteria((c) => ({ ...c, turnWeight: v }))} />
                <NumberField label="Danger" value={criteria.dangerWeight} onChange={(v) => setCriteria((c) => ({ ...c, dangerWeight: v }))} />
                <NumberField label="Répétition" value={criteria.repeatWeight} onChange={(v) => setCriteria((c) => ({ ...c, repeatWeight: v }))} />
                <NumberField label="Coût/pas" value={criteria.baseMoveCost} step={0.5} onChange={(v) => setCriteria((c) => ({ ...c, baseMoveCost: v }))} />
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setCriteria(DEFAULT_CRITERIA)}>
                  Réinitialiser
                </Button>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="w-4 h-4 text-primary/80" />
                Statistiques (agents arrivés)
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-secondary/40 rounded p-3">
                  <div className="text-muted-foreground">Nb arrivés</div>
                  <div className="text-base font-bold">{successful.length}</div>
                </div>
                <div className="bg-secondary/40 rounded p-3">
                  <div className="text-muted-foreground">Longueur moyenne</div>
                  <div className="text-base font-bold">{stats.length.avg.toFixed(1)}</div>
                </div>
                <div className="bg-secondary/40 rounded p-3">
                  <div className="text-muted-foreground">Longueur min/max</div>
                  <div className="text-base font-bold">{stats.length.min} / {stats.length.max}</div>
                </div>
                <div className="bg-secondary/40 rounded p-3">
                  <div className="text-muted-foreground">Virages moy.</div>
                  <div className="text-base font-bold">{stats.turns.avg.toFixed(1)}</div>
                </div>
                <div className="bg-secondary/40 rounded p-3">
                  <div className="text-muted-foreground">Danger moy.</div>
                  <div className="text-base font-bold">{stats.danger.avg.toFixed(1)}</div>
                </div>
                <div className="bg-secondary/40 rounded p-3">
                  <div className="text-muted-foreground">Répétitions moy.</div>
                  <div className="text-base font-bold">{stats.repeat.avg.toFixed(1)}</div>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* Center: maze + chosen path */}
        <section className="relative bg-gradient-to-br from-black via-slate-950 to-black">
          <MazeVisualization />
          <div className="absolute top-4 left-4 right-4 pointer-events-none">
            <Card className="p-4 bg-black/40 backdrop-blur border-white/10">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90 inline-flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-300" />
                  Solution unique
                </div>
                <div className="text-xs text-white/60 inline-flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  {decision.chosen ? decision.chosen.id : 'Aucune'}
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Right: ranked list */}
        <aside className="border-l border-border/50 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="text-lg font-bold">Classement (arrivés)</div>
            <div className="text-xs text-muted-foreground">
              Score minimal = meilleur. Unicité garantie par tie-breakers.
            </div>

            {decision.ranked.length === 0 ? (
              <Card className="p-4 text-sm text-muted-foreground">
                Aucun agent n&apos;a atteint la sortie.
              </Card>
            ) : (
              <div className="space-y-2">
                {decision.ranked.slice(0, 20).map(({ agent, score }, idx) => {
                  const isChosen = decision.chosen?.id === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => selectAgent(agent.id)}
                      className={`w-full text-left rounded-lg border p-4 transition-all ${
                        isChosen ? 'border-amber-400/60 bg-amber-400/10' : 'border-border/60 bg-card/40 hover:bg-card/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold inline-flex items-center gap-2">
                          {isChosen ? <Crown className="w-4 h-4 text-amber-300" /> : <span className="text-xs text-muted-foreground">#{idx + 1}</span>}
                          {agent.id}
                        </div>
                        <div className="text-xs text-muted-foreground">score {score.toFixed(2)}</div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Distance: <span className="text-foreground font-semibold">{agent.length}</span></div>
                        <div>Virages: <span className="text-foreground font-semibold">{agent.turns}</span></div>
                        <div>Danger: <span className="text-foreground font-semibold">{agent.dangerousness}</span></div>
                        <div>Répétitions: <span className="text-foreground font-semibold">{agent.repetitiveness}</span></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

