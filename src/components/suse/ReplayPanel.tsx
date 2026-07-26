/**
 * SUSE - ReplayPanel Component
 * FASE 2: Replay passo-a-passo com controles play/pause/step.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle, Pause, SkipForward, SkipBack, Loader2,
  Clock, TrendingUp, TrendingDown, Minus, AlertTriangle
} from 'lucide-react';
import type { ReplayResult, ReplayStep } from '@/types/trading';
import { cn } from '@/lib/utils';

interface ReplayPanelProps {
  className?: string;
}

export function ReplayPanel({ className }: ReplayPanelProps) {
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(50);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadReplay = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPlaying(false);
    try {
      const resp = await fetch('http://localhost:4000/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_index: 0, count, window_size: 120 }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: ReplayResult = await resp.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setCurrentStep(0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar replay');
    } finally {
      setLoading(false);
    }
  }, [count]);

  // Auto-play
  useEffect(() => {
    if (playing && result && currentStep < result.steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= result.steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    } else {
      setPlaying(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, result, currentStep]);

  const step: ReplayStep | null = result?.steps[currentStep] ?? null;

  const decisionColor = (d: string) => {
    if (d === 'BUY') return 'text-green-600 bg-green-500/15';
    if (d === 'SELL') return 'text-red-600 bg-red-500/15';
    return 'text-yellow-600 bg-yellow-500/15';
  };

  const DecisionIcon = ({ d, className }: { d: string; className?: string }) => {
    if (d === 'BUY') return <TrendingUp className={className} />;
    if (d === 'SELL') return <TrendingDown className={className} />;
    return <Minus className={className} />;
  };

  return (
    <div className={cn('glass-panel rounded-xl border border-border/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <PlayCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Replay de Mercado</h3>
            <p className="text-xs text-muted-foreground">Revise decisões da IA passo-a-passo</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs rounded bg-background border border-border/50 focus:border-primary"
            placeholder="Steps"
          />
          <button
            onClick={loadReplay}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
            Carregar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step display */}
      {step && result ? (
        <div className="p-4 space-y-3">
          {/* Current step info */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} / {result.total_steps}
            </span>
            <span className="text-xs text-muted-foreground">
              Candle #{step.candle_index}
            </span>
          </div>

          {/* Price + Decision */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Preço</p>
              <p className="text-lg font-mono font-semibold">{step.price.toFixed(5)}</p>
            </div>
            <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold', decisionColor(step.decision))}>
              <DecisionIcon d={step.decision} className="w-4 h-4" />
              {step.decision}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase">Confiança</p>
              <p className="text-lg font-semibold">{step.confidence.toFixed(0)}%</p>
            </div>
          </div>

          {/* Probabilities bar */}
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="bg-green-500" style={{ width: `${step.probabilities.buy * 100}%` }} />
            <div className="bg-yellow-500" style={{ width: `${step.probabilities.hold * 100}%` }} />
            <div className="bg-red-500" style={{ width: `${step.probabilities.sell * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>BUY: {(step.probabilities.buy * 100).toFixed(0)}%</span>
            <span>HOLD: {(step.probabilities.hold * 100).toFixed(0)}%</span>
            <span>SELL: {(step.probabilities.sell * 100).toFixed(0)}%</span>
          </div>

          {/* Duration + Features */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-secondary/30">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Duração Est.
              </p>
              <p className="text-xs font-medium">
                {step.estimated_duration.min}–{step.estimated_duration.max} min
              </p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30">
              <p className="text-[10px] text-muted-foreground">Top Features</p>
              <div className="space-y-0.5">
                {Object.entries(step.top_features).slice(0, 3).map(([k, v]) => (
                  <p key={k} className="text-[10px] font-mono">
                    {k}: {v.toFixed(3)}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setCurrentStep(0)}
              disabled={currentStep === 0}
              className="p-2 rounded-lg hover:bg-secondary transition disabled:opacity-30"
              title="Início"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              disabled={currentStep >= result.steps.length - 1}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-30"
              title={playing ? 'Pausar' : 'Reproduzir'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCurrentStep(s => Math.min(s + 1, result.steps.length - 1))}
              disabled={currentStep >= result.steps.length - 1}
              className="p-2 rounded-lg hover:bg-secondary transition disabled:opacity-30"
              title="Próximo"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentStep + 1) / result.steps.length) * 100}%` }}
            />
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="p-6 text-center">
          <PlayCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Clique em Carregar para iniciar o replay.
          </p>
        </div>
      ) : null}
    </div>
  );
}
