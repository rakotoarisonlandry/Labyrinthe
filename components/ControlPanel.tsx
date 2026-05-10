'use client';

import { useMazeStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, LoaderCircle, Play, Square, Target, Flag, Sparkles, Route } from 'lucide-react';

export function ControlPanel() {
  const { mazeSize, generateNewMaze, agentPaths, selectedAgentId, selectAgent, isGenerating, liveSim, startSimulation, stopSimulation } = useMazeStore();
  const [size, setSize] = useState(mazeSize);

  const handleGenerate = () => {
    generateNewMaze(size);
  };

  return (
    <div className="flex flex-col gap-4 h-full bg-gradient-to-b from-background to-card/50">
      {/* Header */}
      <div className="pt-6 px-6 border-b border-border/50">
        <h1 className="text-3xl font-bold text-primary mb-1">Explorateur Labyrinthe</h1>
        <p className="text-xs text-muted-foreground">Simulation multi-agents : parcours aléatoires jusqu&apos;à la sortie</p>
      </div>

      {/* Objective Explanation */}
      <Card className="px-6 py-4 mx-6 bg-primary/5 border border-primary/20">
        <h3 className="text-sm font-semibold text-primary mb-2">L&apos;Objectif</h3>
        <p className="text-xs text-foreground leading-relaxed">
          Lancez plusieurs agents en même temps. À chaque intersection, chacun choisit une direction au hasard avec une mémoire courte (il évite de revenir immédiatement en arrière). La simulation s&apos;arrête quand 10 agents ont trouvé la sortie.
        </p>
      </Card>

      {/* Maze Size Control */}
      <Card className="px-6 py-4 mx-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold">Taille du Labyrinthe</label>
          <span className="text-lg font-bold text-primary">{size}x{size}</span>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="range"
            min="5"
            max="30"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            disabled={isGenerating}
          />
        </div>
        <Button
          onClick={handleGenerate}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Génération...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Générer le Labyrinthe
            </span>
          )}
        </Button>
      </Card>

      {/* Simulation Controls */}
      <Card className="px-6 py-4 mx-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold">Simulation</label>
          <span className="text-xs text-muted-foreground">
            {liveSim?.isRunning ? 'en cours' : 'prête'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => startSimulation()}
            className="flex-1"
            variant="secondary"
            disabled={isGenerating}
          >
            <span className="inline-flex text-xs items-center gap-1">
              <Play className="w-4 h-4" />
              Relancer
            </span>
          </Button>
          <Button
            onClick={() => stopSimulation()}
            className="flex-1"
            variant="secondary"
            disabled={!liveSim?.isRunning}
          >
            <span className="inline-flex text-xs items-center gap-1">
              <Square className="w-4 h-4" />
              Stop
            </span>
          </Button>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>
            Arrêt après <span className="font-semibold text-foreground">{liveSim?.targetSuccesses ?? 10}</span> sorties trouvées
          </span>
        </div>

        <div className="mt-3">
          <Link href="/decision" className="block">
            <Button variant="secondary" className="w-full">
              Décideur
            </Button>
          </Link>
        </div>
      </Card>

      {/* Agent Selection */}
      <Card className="px-6 py-4 mx-6">
        <label className="block text-sm font-semibold mb-4">Sélectionnez un Agent</label>
        <div className="flex flex-col gap-2">
          {agentPaths.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-secondary/40 rounded-lg p-3">
              Générez un labyrinthe pour lancer les agents.
            </div>
          ) : (
            agentPaths.slice(0, 10).map((agent) => (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent.id)}
                className={`px-4 py-3 rounded-lg font-medium transition-all text-left ${
                  selectedAgentId === agent.id
                    ? 'bg-primary/15 text-primary border-2 border-primary/60'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="block text-sm inline-flex items-center gap-2">
                    {agent.foundExit ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <LoaderCircle className="w-4 h-4 text-muted-foreground/80" />
                    )}
                    {agent.id}
                  </span>
                  <span className="text-xs opacity-75">
                    {agent.length} pas • {agent.turns} virages
                  </span>
                </div>
                <span className="text-xs opacity-75">
                  Impasses évitées: {agent.dangerousness} • Répétitions: {agent.repetitiveness}
                </span>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card className="px-6 py-4 mx-6">
        <label className="block text-sm font-semibold mb-3">Légende</label>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-3">
            <Flag className="w-4 h-4 text-emerald-400" />
            <span>Départ</span>
          </div>
          <div className="flex items-center gap-3">
            <Route className="w-4 h-4 text-primary" />
            <span>Agent sélectionné</span>
          </div>
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Sortie</span>
          </div>
        </div>
      </Card>

      {/* Controls Help */}
      <Card className="px-6 py-4 mx-6 bg-secondary/30 border border-border/50">
        <label className="block text-xs font-semibold text-primary mb-2">Contrôles</label>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Glissez pour explorer la vue</div>
          <div>Utilisez la molette pour zoomer</div>
        </div>
      </Card>

      <div className="px-6 pb-6 text-xs text-muted-foreground/60">
        copyright &copy; 2026 - Explorateur Labyrinthe. Tous droits réservés.
      </div>
    </div>
  );
}
