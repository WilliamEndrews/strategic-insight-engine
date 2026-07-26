import { useAuth } from '@/hooks/useAuth';

export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
export type TradingStyle = 'DAY' | 'SWING' | 'POSITION' | 'SCALP' | 'MIXED' | 'EXPLORING';

interface DashboardConfig {
  showShap: boolean;
  showBacktest: boolean;
  showReplay: boolean;
  showRisk: boolean;
  showPaperTrading: boolean;
  showAlerts: boolean;
  showHistory: boolean;
  showIndicators: boolean;
  showMultiAssets: boolean;
  showConfidence: boolean;
  minConfidence: number;
  explanationStyle: 'didactic' | 'technical' | 'detailed';
  defaultTimeframe: string;
  sidebarLayout: 'simple' | 'balanced' | 'dense';
}

const DEFAULT_CONFIG: DashboardConfig = {
  showShap: true,
  showBacktest: true,
  showReplay: true,
  showRisk: true,
  showPaperTrading: true,
  showAlerts: true,
  showHistory: true,
  showIndicators: true,
  showMultiAssets: true,
  showConfidence: true,
  minConfidence: 50,
  explanationStyle: 'technical',
  defaultTimeframe: 'M15',
  sidebarLayout: 'balanced',
};

const BEGINNER_CONFIG: DashboardConfig = {
  showShap: false,
  showBacktest: false,
  showReplay: false,
  showRisk: true,
  showPaperTrading: true,
  showAlerts: true,
  showHistory: false,
  showIndicators: true,
  showMultiAssets: false,
  showConfidence: true,
  minConfidence: 70,
  explanationStyle: 'didactic',
  defaultTimeframe: 'M15',
  sidebarLayout: 'simple',
};

const ADVANCED_CONFIG: DashboardConfig = {
  showShap: true,
  showBacktest: true,
  showReplay: true,
  showRisk: true,
  showPaperTrading: true,
  showAlerts: true,
  showHistory: true,
  showIndicators: true,
  showMultiAssets: true,
  showConfidence: true,
  minConfidence: 40,
  explanationStyle: 'detailed',
  defaultTimeframe: 'M15',
  sidebarLayout: 'dense',
};

const STYLE_TIMEFRAMES: Record<TradingStyle, string> = {
  DAY: 'M5',
  SWING: 'H1',
  POSITION: 'D1',
  SCALP: 'M1',
  MIXED: 'M15',
  EXPLORING: 'M15',
};

export function useDashboardConfig(): DashboardConfig {
  const { profile } = useAuth();

  if (!profile || !profile.onboarding_completed) {
    return DEFAULT_CONFIG;
  }

  const level = (profile.experience_level || 'INTERMEDIATE') as ExperienceLevel;
  const style = (profile.trading_style || 'MIXED') as TradingStyle;

  let base: DashboardConfig;
  switch (level) {
    case 'BEGINNER':
      base = { ...BEGINNER_CONFIG };
      break;
    case 'ADVANCED':
    case 'PROFESSIONAL':
      base = { ...ADVANCED_CONFIG };
      break;
    default:
      base = { ...DEFAULT_CONFIG };
  }

  base.defaultTimeframe = STYLE_TIMEFRAMES[style] || 'M15';

  return base;
}
