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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
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
import { CollapsiblePanel } from '@/components/suse/CollapsiblePanel';
import {
  Info, History, PlayCircle, Shield, Wallet, Gauge, BrainCircuit,
  Bell, Activity, LayoutGrid, AlertTriangle,
} from 'lucide-react';
import {
  mockCandles,
  mockAnalysisResult,
} from '@/lib/mockData';
import type { AnalysisResult } from '@/types/trading';

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
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const config = useDashboardConfig();
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  /**
   * Busca análise do backend usando a rota correta (/ia)
   * Se o backend estiver offline, usa dados mock como fallback
   */
  async function fetchAnalysis() {
    try {
      console.log('Iniciando fetch para /ia (120 candles)');
      setIsLoading(true);
      setUsingMockData(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('http://localhost:4000/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candles: mockCandles }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Status recebido:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Análise recebida com sucesso:', data.aiDecision?.decision || 'N/A');
      setAnalysisData(data);
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
      console.warn('Backend offline — usando dados de demonstração');
      setAnalysisData(mockAnalysisResult);
      setUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  }

  // Carrega análise ao montar o componente
  useEffect(() => {
    fetchAnalysis();
  }, []);

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
          {/* Barra de status e perfil */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                {profile?.trading_style || '—'} • {profile?.experience_level || '—'}
              </span>
              {config.defaultTimeframe && (
                <span className="text-sm text-muted-foreground">
                  Timeframe padrão: <span className="font-mono text-foreground">{config.defaultTimeframe}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">Olá, {profile?.full_name || user?.email}</span>
              <button
                onClick={() => navigate('/settings')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                Configurações
              </button>
              <button
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              >
                Sair
              </button>
              <button
                onClick={fetchAnalysis}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 transition ml-2"
              >
                Atualizar Análise
              </button>
            </div>
          </div>

          {/* Banner modo demonstração */}
          {usingMockData && (
            <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <span className="text-yellow-700 dark:text-yellow-400">
                <strong>Modo demonstração</strong> — Backend offline. Exibindo dados simulados.
                Inicie o backend em <span className="font-mono">localhost:4000</span> para análise em tempo real.
              </span>
              <button
                onClick={fetchAnalysis}
                className="ml-auto px-3 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30 transition flex-shrink-0"
              >
                Tentar reconectar
              </button>
            </div>
          )}

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

              <CollapsiblePanel title="Análise da Decisão" icon={Info} description="Raciocínio por trás da decisão">
                <ExplanationPanel
                  explanations={analysisData.aiDecision.explanations}
                  warnings={analysisData.aiDecision.warnings}
                />
              </CollapsiblePanel>

              {(config.showBacktest || config.showReplay) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {config.showBacktest && (
                    <CollapsiblePanel title="Backtesting" icon={History} description="Teste a IA em dados históricos">
                      <BacktestPanel />
                    </CollapsiblePanel>
                  )}
                  {config.showReplay && (
                    <CollapsiblePanel title="Replay de Mercado" icon={PlayCircle} description="Revise decisões passo-a-passo">
                      <ReplayPanel />
                    </CollapsiblePanel>
                  )}
                </div>
              )}

              {config.showRisk && (
                <CollapsiblePanel title="Gestão de Risco" icon={Shield} description="Position sizing e R:R">
                  <RiskPanel />
                </CollapsiblePanel>
              )}

              {config.showPaperTrading && (
                <CollapsiblePanel title="Paper Trading" icon={Wallet} description="Conta virtual — sem risco real">
                  <PaperTradingPanel
                    currentPrice={analysisData.marketData?.ohlc?.close || 0}
                    currentDecision={analysisData.aiDecision.decision}
                    currentConfidence={analysisData.aiDecision.confidence}
                  />
                </CollapsiblePanel>
              )}
            </div>

            {/* Barra lateral */}
            <div className="space-y-6">
              {config.showConfidence && (
                <CollapsiblePanel title="Distribuição de Probabilidades" icon={Gauge} description="Nível de confiança da IA">
                  <ConfidenceMeter
                    probabilities={analysisData.aiDecision.probabilities}
                    confidence={analysisData.aiDecision.confidence}
                  />
                </CollapsiblePanel>
              )}

              {config.showShap && (
                <CollapsiblePanel title="Explicabilidade (SHAP)" icon={BrainCircuit} description="Features que influenciaram a IA">
                  <ShapPanel shapValues={analysisData.aiDecision.shap_values} />
                </CollapsiblePanel>
              )}

              {config.showAlerts && (
                <CollapsiblePanel title="Alertas" icon={Bell} description="Notificações automáticas">
                  <AlertsPanel />
                </CollapsiblePanel>
              )}

              {config.showHistory && (
                <CollapsiblePanel title="Histórico de Decisões" icon={History} description="Registro de decisões">
                  <DecisionHistory />
                </CollapsiblePanel>
              )}

              {config.showIndicators && (
                <CollapsiblePanel title="Indicadores Técnicos" icon={Activity} description="Visão técnica do mercado">
                  <IndicatorPanel analysis={analysisData.technicalAnalysis} />
                </CollapsiblePanel>
              )}
            </div>
          </div>

          {config.showMultiAssets && (
            <div className="mt-8">
              <CollapsiblePanel title="Multi-Ativos" icon={LayoutGrid} description="Visão geral por ativo">
                <AssetSelector />
              </CollapsiblePanel>
            </div>
          )}

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