/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Main Dashboard Page
 * 
 * PURPOSE:
 * This is the primary interface for traders using SUSE.
 * It presents the AI decision, explanations, and technical indicators
 * in a clean, professional layout designed for extended use.
 * 
 * LAYOUT STRUCTURE:
 * - Header: Asset info, price, connection status
 * - Main: Decision card (prominent), explanation panel
 * - Sidebar: Technical indicators, probability distribution
 * - Footer: Future feature placeholders
 * 
 * HUMAN-IN-THE-LOOP PHILOSOPHY:
 * The AI suggests, the trader decides.
 * Every piece of information is presented to empower decision-making.
 */

import { useState, useEffect } from 'react';
import { MarketHeader } from '@/components/suse/MarketHeader';
import { DecisionCard } from '@/components/suse/DecisionCard';
import { ExplanationPanel } from '@/components/suse/ExplanationPanel';
import { ConfidenceMeter } from '@/components/suse/ConfidenceMeter';
import { IndicatorPanel } from '@/components/suse/IndicatorPanel';
import { FutureFeatureCard } from '@/components/suse/FutureFeatureCard';
import {
  mockAnalysisResult,
  mockBuyDecision,
  mockSellDecision,
  mockHoldDecision,
} from '@/lib/mockData';
import type { AIDecision } from '@/types/trading';

/**
 * Demo mode: Cycle through different decisions to showcase UI.
 * In production, this will be replaced by real-time data.
 */
const demoDecisions: AIDecision[] = [mockBuyDecision, mockSellDecision, mockHoldDecision];

const Index = () => {
  // State for current analysis
  const [currentDecision, setCurrentDecision] = useState<AIDecision>(mockBuyDecision);
  const [demoIndex, setDemoIndex] = useState(0);

  // Demo mode: Auto-cycle decisions every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoIndex((prev) => (prev + 1) % demoDecisions.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentDecision(demoDecisions[demoIndex]);
  }, [demoIndex]);

  // Manual decision switching for demo
  const handleDecisionSwitch = (decision: AIDecision) => {
    setCurrentDecision(decision);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Market Header - Always visible at top */}
      <MarketHeader
        marketData={mockAnalysisResult.marketData}
        trend={mockAnalysisResult.technicalAnalysis.trend}
        isConnected={true}
        className="sticky top-0 z-50"
      />

      {/* Main content area */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Demo mode indicator */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium animate-pulse-glow">
              MODO DEMONSTRAÇÃO
            </span>
            <span className="text-xs text-muted-foreground">
              Sinais alternam automaticamente para demonstrar a interface
            </span>
          </div>

          {/* Manual decision buttons for demo */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Testar sinal:</span>
            <button
              onClick={() => handleDecisionSwitch(mockBuyDecision)}
              className="px-3 py-1 rounded text-xs font-medium bg-signal-buy-muted text-signal-buy hover:bg-signal-buy/30 transition-colors"
            >
              BUY
            </button>
            <button
              onClick={() => handleDecisionSwitch(mockSellDecision)}
              className="px-3 py-1 rounded text-xs font-medium bg-signal-sell-muted text-signal-sell hover:bg-signal-sell/30 transition-colors"
            >
              SELL
            </button>
            <button
              onClick={() => handleDecisionSwitch(mockHoldDecision)}
              className="px-3 py-1 rounded text-xs font-medium bg-signal-hold-muted text-signal-hold hover:bg-signal-hold/30 transition-colors"
            >
              HOLD
            </button>
          </div>
        </div>

        {/* Main grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Decision and explanation (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Decision Card - The star of the show */}
            <DecisionCard
              decision={currentDecision.decision}
              confidence={currentDecision.confidence}
              timestamp={currentDecision.timestamp}
            />

            {/* Explanation Panel */}
            <ExplanationPanel
              explanations={currentDecision.explanations}
              warnings={currentDecision.warnings}
            />

            {/* Future features row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FutureFeatureCard feature="backtest" />
              <FutureFeatureCard feature="replay" />
            </div>
          </div>

          {/* Right column - Indicators and probabilities (1/3 width) */}
          <div className="space-y-6">
            {/* Confidence distribution */}
            <ConfidenceMeter probabilities={currentDecision.probabilities} />

            {/* Technical indicators */}
            <IndicatorPanel analysis={mockAnalysisResult.technicalAnalysis} />

            {/* More future features */}
            <FutureFeatureCard feature="strategy" />
          </div>
        </div>

        {/* Bottom section - Additional future features */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FutureFeatureCard feature="multiasset" />
          <FutureFeatureCard feature="logs" />
          <div className="glass-panel p-4 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              <span className="text-primary font-medium">SUSE v0.1 MVP</span>
              <br />
              Sistema Unificado de Suporte Estratégico
              <br />
              <span className="text-xs">A IA sugere. Você decide.</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="border-t border-border/50 py-4">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ <strong>Aviso:</strong> O SUSE é uma ferramenta de suporte à decisão. 
            Não garante lucro e não executa ordens automaticamente. 
            Toda decisão final é responsabilidade do trader.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
