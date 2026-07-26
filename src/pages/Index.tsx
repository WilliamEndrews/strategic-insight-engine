/**
 * SUSE - Sistema Unificado de Suporte Estratégico
 * Página Principal do Dashboard (Index.tsx)
 * 
 * PROPÓSITO:
 * Interface principal para traders. Mostra decisão da IA, explicações,
 * indicadores técnicos, confiança e duração estimada.
 * 
 * ATUALIZAÇÃO 06/04/2026:
 * - Rota corrigida para /ia (backend atual)
 * - Removidos resquícios de extensão Chrome que causavam erros
 * - Error Boundary mantido para estabilidade
 */

import { useState, useEffect, Component, ReactNode } from 'react';
import { MarketHeader } from '@/components/suse/MarketHeader';
import { DecisionCard } from '@/components/suse/DecisionCard';
import { ExplanationPanel } from '@/components/suse/ExplanationPanel';
import { ConfidenceMeter } from '@/components/suse/ConfidenceMeter';
import { IndicatorPanel } from '@/components/suse/IndicatorPanel';
import { ShapPanel } from '@/components/suse/ShapPanel';
import { BacktestPanel } from '@/components/suse/BacktestPanel';
import { ReplayPanel } from '@/components/suse/ReplayPanel';
import { RiskPanel } from '@/components/suse/RiskPanel';
import { AlertsPanel } from '@/components/suse/AlertsPanel';
import { AssetSelector } from '@/components/suse/AssetSelector';
import { DecisionHistory } from '@/components/suse/DecisionHistory';
import { PaperTradingPanel } from '@/components/suse/PaperTradingPanel';
import {
  mockAnalysisResult,
  mockBuyDecision,
  mockSellDecision,
  mockHoldDecision,
  mockCandles,
} from '@/lib/mockData';
import type { AIDecision, AnalysisResult } from '@/types/trading';

// Error Boundary simples
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-destructive">
          <div className="text-center max-w-md p-8 border border-destructive/30 rounded-xl bg-destructive/5 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Algo deu errado</h2>
            <p className="text-muted-foreground mb-6">
              O dashboard encontrou um erro ao carregar. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium shadow-md"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca análise do backend usando a rota correta (/ia)
   */
  async function fetchAnalysis() {
    try {
      console.log('Iniciando fetch para /ia (120 candles)');
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:4000/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candles: mockCandles })
      });

      console.log('Status recebido:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Análise recebida com sucesso:', data.aiDecision?.decision || 'N/A');
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Erro ao buscar análise:', err);
      setError(err.message || 'Erro ao conectar com o backend. Verifique se ele está rodando.');
    } finally {
      setIsLoading(false);
    }
  }

  // Carrega análise ao montar o componente
  useEffect(() => {
    fetchAnalysis();
  }, []);

  /**
   * Função para trocar manualmente a decisão (útil para testes)
   */
  const handleDecisionSwitch = (decision: AIDecision) => {
    setAnalysisData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        aiDecision: decision,
      };
    });
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Carregando análise em tempo real...</p>
          <p className="text-sm text-muted-foreground mt-2">Conectando ao backend...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8 border border-destructive/30 rounded-xl bg-destructive/5 shadow-lg">
          <h2 className="text-2xl font-bold text-destructive mb-4">Erro ao carregar análise</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium shadow-md"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Nenhuma análise disponível. Tente atualizar.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Cabeçalho */}
        <MarketHeader
          marketData={analysisData.marketData}
          trend={analysisData.technicalAnalysis?.trend}
          isConnected={true}
          className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
        />

        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {/* Barra de status e testes */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium animate-pulse">
                MODO DESENVOLVIMENTO
              </span>
              <span className="text-sm text-muted-foreground">
                Conectado ao backend (localhost:4000) • 120 candles
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">Testar sinal manual:</span>
              <button
                onClick={() => handleDecisionSwitch(mockBuyDecision)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-700 hover:bg-green-500/30 transition"
              >
                BUY
              </button>
              <button
                onClick={() => handleDecisionSwitch(mockSellDecision)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-700 hover:bg-red-500/30 transition"
              >
                SELL
              </button>
              <button
                onClick={() => handleDecisionSwitch(mockHoldDecision)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 transition"
              >
                HOLD
              </button>
              <button
                onClick={fetchAnalysis}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 transition ml-2"
              >
                Atualizar Análise
              </button>
            </div>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-6">
              <DecisionCard
                decision={analysisData.aiDecision.decision}
                confidence={analysisData.aiDecision.confidence}
                timestamp={analysisData.aiDecision.timestamp}
                estimatedDuration={analysisData.aiDecision.estimated_duration}
              />

              <ExplanationPanel
                explanations={analysisData.aiDecision.explanations}
                warnings={analysisData.aiDecision.warnings}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BacktestPanel />
                <ReplayPanel />
              </div>

              <RiskPanel />

              <PaperTradingPanel
                currentPrice={analysisData.marketData?.ohlc?.close || 0}
                currentDecision={analysisData.aiDecision.decision}
                currentConfidence={analysisData.aiDecision.confidence}
              />
            </div>

            {/* Barra lateral */}
            <div className="space-y-6">
              <ConfidenceMeter 
                probabilities={analysisData.aiDecision.probabilities} 
                confidence={analysisData.aiDecision.confidence} 
              />

              <ShapPanel shapValues={analysisData.aiDecision.shap_values} />

              <AlertsPanel />

              <DecisionHistory />

              <IndicatorPanel analysis={analysisData.technicalAnalysis} />
            </div>
          </div>

          {/* Multi-ativos */}
          <div className="mt-8">
            <AssetSelector />
          </div>

          {/* Rodapé */}
          <div className="mt-8">
            <div className="glass-panel p-6 flex items-center justify-center border border-border/50 rounded-xl">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                <span className="text-primary font-semibold block mb-1">SUSE v2.0 — Fase 5</span>
                Sistema Unificado de Suporte Estratégico
                <br />
                <span className="text-xs">A IA sugere. Você decide.</span>
              </p>
            </div>
          </div>
        </main>

        {/* Disclaimer */}
        <footer className="border-t border-border/50 py-6 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              ⚠️ <strong>Aviso importante:</strong> O SUSE é uma ferramenta de suporte à decisão. 
              Não garante lucro e não substitui análise profissional. 
              Toda decisão final é de responsabilidade exclusiva do trader.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default Index;