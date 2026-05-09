'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useMazeStore } from '@/lib/store';

const PADDING = 24;
const WALL = 8;
const STEP_MS = 520; // slow-motion duration for one cell move

export function MazeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const { maze, liveSim, agentPaths, selectedAgentId, tickSimulation } = useMazeStore();

  const palette = useMemo(
    () => ['#ff3366', '#3366ff', '#33ff66', '#ffcc33', '#cc66ff', '#33ffff', '#ff6633', '#66ff99', '#ff99cc', '#99ccff'],
    []
  );

  // Advance simulation at a steady rate while running
  useEffect(() => {
    if (!maze || !liveSim?.isRunning) return;
    const id = window.setInterval(() => tickSimulation(), STEP_MS);
    return () => window.clearInterval(id);
  }, [maze, liveSim?.isRunning, tickSimulation]);

  // Render loop (canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? 800;
      const h = parent?.clientHeight ?? 600;

      if (canvas.width !== Math.floor(w * window.devicePixelRatio) || canvas.height !== Math.floor(h * window.devicePixelRatio)) {
        canvas.width = Math.floor(w * window.devicePixelRatio);
        canvas.height = Math.floor(h * window.devicePixelRatio);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      }

      // Background
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, w, h);

      if (!maze) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '600 14px ui-sans-serif, system-ui';
        ctx.fillText('Générez un labyrinthe…', 24, 32);
        rafRef.current = window.requestAnimationFrame(render);
        return;
      }

      const gridW = w - PADDING * 2;
      const gridH = h - PADDING * 2;
      const cell = Math.floor(Math.min(gridW / maze.width, gridH / maze.height));
      const offsetX = Math.floor((w - cell * maze.width) / 2);
      const offsetY = Math.floor((h - cell * maze.height) / 2);

      // Helper mapping
      const cx = (x: number) => offsetX + x * cell;
      const cy = (y: number) => offsetY + y * cell;

      // Subtle board
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(offsetX, offsetY, cell * maze.width, cell * maze.height);

      // Walls
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(2, Math.floor(cell * 0.12));
      ctx.lineCap = 'square';

      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
          const c = maze.cells[y][x];
          const x0 = cx(x);
          const y0 = cy(y);
          const x1 = x0 + cell;
          const y1 = y0 + cell;

          ctx.beginPath();
          if (c.walls.top) {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y0);
          }
          if (c.walls.right) {
            ctx.moveTo(x1, y0);
            ctx.lineTo(x1, y1);
          }
          if (c.walls.bottom) {
            ctx.moveTo(x0, y1);
            ctx.lineTo(x1, y1);
          }
          if (c.walls.left) {
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0, y1);
          }
          ctx.stroke();
        }
      }

      // Start + Exit markers (visible)
      const drawMarker = (p: { x: number; y: number }, fill: string, ring: string) => {
        const mx = cx(p.x) + cell / 2;
        const my = cy(p.y) + cell / 2;
        const r = Math.max(6, cell * 0.22);
        ctx.beginPath();
        ctx.fillStyle = fill;
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = Math.max(2, cell * 0.08);
        ctx.strokeStyle = ring;
        ctx.stroke();
      };

      drawMarker(maze.start, 'rgba(34,197,94,0.35)', 'rgba(34,197,94,0.95)'); // emerald
      drawMarker(maze.end, 'rgba(245,158,11,0.35)', 'rgba(245,158,11,0.95)'); // amber

      // Agents (live positions)
      const agents = liveSim?.agents ?? [];
      const now = Date.now();
      const progress = liveSim ? Math.max(0, Math.min(1, (now - liveSim.lastTickAtMs) / STEP_MS)) : 1;
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const color = palette[i % palette.length];
        const isSelected = selectedAgentId === a.id;
        const from = a.prev ?? a.current;
        const ix = from.x + (a.current.x - from.x) * progress;
        const iy = from.y + (a.current.y - from.y) * progress;
        const ax = cx(ix) + cell / 2;
        const ay = cy(iy) + cell / 2;
        const r = Math.max(3.5, cell * 0.14);

        // glow for selected
        if (isSelected) {
          ctx.beginPath();
          ctx.fillStyle = `${color}33`;
          ctx.arc(ax, ay, r * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // body (little "man" head + torso line)
        const bodyR = isSelected ? r * 1.25 : r;
        ctx.beginPath();
        ctx.fillStyle = a.foundExit ? 'rgba(255,255,255,0.92)' : color;
        ctx.arc(ax, ay - bodyR * 0.4, bodyR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = Math.max(1, bodyR * 0.45);
        ctx.beginPath();
        ctx.moveTo(ax, ay + bodyR * 0.1);
        ctx.lineTo(ax, ay + bodyR * 1.8);
        ctx.stroke();

        // outline for head
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(ax, ay - bodyR * 0.4, bodyR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Selected path trace (thin line)
      const sel = selectedAgentId ? agentPaths.find((p) => p.id === selectedAgentId) : agentPaths[0];
      if (sel && Array.isArray(sel.points) && sel.points.length > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = Math.max(1, cell * 0.06);
        ctx.beginPath();
        for (let i = 0; i < sel.points.length; i++) {
          const p = sel.points[i];
          const px = cx(p.x) + cell / 2;
          const py = cy(p.y) + cell / 2;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      rafRef.current = window.requestAnimationFrame(render);
    };

    rafRef.current = window.requestAnimationFrame(render);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [maze, liveSim?.agents, liveSim?.isRunning, agentPaths, selectedAgentId, palette]);

  return (
    <div className="w-full h-full bg-black relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute left-4 bottom-4 flex items-center gap-3 text-xs text-white/70 select-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400/80 ring-2 ring-emerald-300/80" />
          <span>Départ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400/80 ring-2 ring-amber-300/80" />
          <span>Sortie</span>
        </div>
        <div className="hidden md:block text-white/35">•</div>
        <div className="hidden md:block text-white/60">
          Agents: <span className="text-white/85 font-semibold">{liveSim?.agents.length ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
