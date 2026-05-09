'use client';

import { useEffect } from 'react';
import { ControlPanel } from '@/components/ControlPanel';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { MazeVisualization } from '@/components/MazeVisualization';
import { InstructionsOverlay } from '@/components/InstructionsOverlay';
import { useMazeStore } from '@/lib/store';

export default function Home() {
  const generateNewMaze = useMazeStore((state) => state.generateNewMaze);

  useEffect(() => {
    // Generate initial maze on mount
    generateNewMaze(15);
  }, [generateNewMaze]);

  return (
    <main className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Left Panel - Controls */}
      <aside className="w-72 bg-card border-r border-border/50 overflow-y-auto shadow-lg hover:shadow-primary/10 transition-shadow">
        <ControlPanel />
      </aside>

      {/* Center - 3D Visualization */}
      <section className="flex-1 bg-gradient-to-br from-black via-slate-950 to-black relative">
        <MazeVisualization />
        
        {/* Subtle corner accent */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none opacity-20"></div>
      </section>

      {/* Right Panel - Comparison */}
      <aside className="w-96 bg-card border-l border-border/50 overflow-y-auto shadow-lg hover:shadow-primary/10 transition-shadow">
        <ComparisonPanel />
      </aside>

      {/* Instructions Overlay */}
      <InstructionsOverlay />
    </main>
  );
}
