import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2, Check, ChevronRight, ChevronLeft, TrendingUp, Clock,
  Target, Zap, Compass, Shield, AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TRADING_STYLES = [
  { value: 'DAY', label: 'Day Trader', desc: 'Operações no mesmo dia, múltiplas entradas', icon: Zap, timeframe: 'M5/M15' },
  { value: 'SWING', label: 'Swing Trader', desc: 'Posições de 2 a 15 dias', icon: Clock, timeframe: 'H1/H4' },
  { value: 'POSITION', label: 'Position / Long-term', desc: 'Semanas a meses', icon: Target, timeframe: 'D1/W1' },
  { value: 'SCALP', label: 'Scalper', desc: 'Segundos a minutos', icon: TrendingUp, timeframe: 'M1/M5' },
  { value: 'MIXED', label: 'Misto', desc: 'Combino mais de um estilo', icon: Compass, timeframe: 'M15/H1' },
  { value: 'EXPLORING', label: 'Ainda descobrindo', desc: 'Estou começando a explorar', icon: Compass, timeframe: 'M15' },
];

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Iniciante', desc: 'Menos de 1 ano ou ainda em demo' },
  { value: 'INTERMEDIATE', label: 'Intermediário', desc: '1 a 4 anos, já opera com capital real' },
  { value: 'ADVANCED', label: 'Avançado', desc: 'Mais de 4 anos, estratégias próprias' },
  { value: 'PROFESSIONAL', label: 'Profissional', desc: 'Vive de trading ou capital de terceiros' },
];

const ASSETS = ['Forex', 'Índices', 'Ações BR', 'Cripto', 'Commodities', 'Futuros'];
const PLATFORMS = ['MetaTrader 5', 'Profit', 'TradingView', 'NinjaTrader', 'Nenhuma ainda'];
const RISK_PROFILES = [
  { value: 'CONSERVADOR', label: 'Conservador', desc: 'Preservar capital acima de tudo' },
  { value: 'MODERADO', label: 'Moderado', desc: 'Equilíbrio entre risco e retorno' },
  { value: 'AGRESSIVO', label: 'Agressivo', desc: 'Busco maximizar retornos' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo');
  const [tradingStyle, setTradingStyle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [stopLossHabit, setStopLossHabit] = useState<boolean | null>(null);
  const [drawdownExperience, setDrawdownExperience] = useState<boolean | null>(null);
  const [hasTradingPlan, setHasTradingPlan] = useState<boolean | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [riskProfile, setRiskProfile] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const adjustExperienceLevel = (): string => {
    if (!experienceLevel) return 'BEGINNER';
    if (experienceLevel === 'ADVANCED' || experienceLevel === 'PROFESSIONAL') {
      if (stopLossHabit === false || hasTradingPlan === false) {
        return 'INTERMEDIATE';
      }
    }
    return experienceLevel;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const finalLevel = adjustExperienceLevel();
      const styleData = TRADING_STYLES.find((s) => s.value === tradingStyle);
      const defaultTimeframes = styleData ? [styleData.timeframe] : ['M15'];

      const { error: updateError } = await supabase
        .from('trader_profiles')
        .update({
          full_name: fullName || null,
          country,
          timezone,
          trading_style: tradingStyle,
          experience_level: finalLevel,
          risk_profile: riskProfile || 'MODERADO',
          preferred_timeframes: defaultTimeframes,
          preferred_assets: selectedAssets,
          platforms_used: selectedPlatforms,
          stop_loss_habit: stopLossHabit,
          drawdown_experience: drawdownExperience,
          has_trading_plan: hasTradingPlan,
          lgpd_consent: lgpdConsent,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return tradingStyle !== '';
      case 2: return experienceLevel !== '' && stopLossHabit !== null && drawdownExperience !== null && hasTradingPlan !== null;
      case 3: return selectedAssets.length > 0;
      case 4: return lgpdConsent;
      default: return false;
    }
  };

  const next = () => {
    if (step < totalSteps - 1 && canProceed()) {
      setStep(step + 1);
    } else if (step === totalSteps - 1 && canProceed()) {
      handleFinish();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">Bem-vindo ao SUSE</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vamos personalizar sua experiência em menos de 3 minutos
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Etapa {step + 1} de {totalSteps}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-border/50 p-6 md:p-8 min-h-[400px] flex flex-col">
          {step === 0 && (
            <div className="space-y-4 flex-1">
              <StepHeader title="Dados básicos" subtitle="Opcional — pode editar depois" />
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Nome completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-primary text-sm text-foreground outline-none transition"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">País</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-primary text-sm text-foreground outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Fuso horário</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border/50 focus:border-primary text-sm text-foreground outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 flex-1">
              <StepHeader title="Estilo de trading" subtitle="Isso define seu timeframe padrão e frequência da IA" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRADING_STYLES.map((style) => (
                  <StyleCard
                    key={style.value}
                    icon={style.icon}
                    label={style.label}
                    desc={style.desc}
                    badge={style.timeframe}
                    selected={tradingStyle === style.value}
                    onClick={() => setTradingStyle(style.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 flex-1">
              <StepHeader title="Nível de experiência" subtitle="Seja honesto — o sistema ajusta para sua segurança" />
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setExperienceLevel(level.value)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition',
                      experienceLevel === level.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-border'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{level.label}</p>
                        <p className="text-xs text-muted-foreground">{level.desc}</p>
                      </div>
                      {experienceLevel === level.value && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ajuste de perfil
                </p>
                <ValidationQuestion
                  question="Você usa stop loss em 100% das operações?"
                  value={stopLossHabit}
                  onChange={setStopLossHabit}
                />
                <ValidationQuestion
                  question="Já passou por um drawdown maior que 15%?"
                  value={drawdownExperience}
                  onChange={setDrawdownExperience}
                />
                <ValidationQuestion
                  question="Possui um plano de trading escrito?"
                  value={hasTradingPlan}
                  onChange={setHasTradingPlan}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 flex-1">
              <StepHeader title="Preferências" subtitle="Quais ativos e plataformas você usa?" />
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Ativos de interesse</label>
                <div className="flex flex-wrap gap-2">
                  {ASSETS.map((asset) => (
                    <Chip
                      key={asset}
                      label={asset}
                      selected={selectedAssets.includes(asset)}
                      onClick={() => setSelectedAssets((arr) => toggleArrayItem(arr, asset))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Plataformas que já usou</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <Chip
                      key={platform}
                      label={platform}
                      selected={selectedPlatforms.includes(platform)}
                      onClick={() => setSelectedPlatforms((arr) => toggleArrayItem(arr, platform))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Perfil de risco</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {RISK_PROFILES.map((rp) => (
                    <button
                      key={rp.value}
                      onClick={() => setRiskProfile(rp.value)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition',
                        riskProfile === rp.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 hover:border-border'
                      )}
                    >
                      <p className="text-sm font-semibold text-foreground">{rp.label}</p>
                      <p className="text-xs text-muted-foreground">{rp.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 flex-1">
              <StepHeader title="Confirmação" subtitle="Revise seu perfil e ative o SUSE" />

              <div className="space-y-3">
                <ProfileSummary label="Nome" value={fullName || 'Não informado'} />
                <ProfileSummary label="Estilo" value={TRADING_STYLES.find((s) => s.value === tradingStyle)?.label || '—'} />
                <ProfileSummary label="Nível" value={EXPERIENCE_LEVELS.find((l) => l.value === adjustExperienceLevel())?.label || '—'} />
                <ProfileSummary label="Risco" value={RISK_PROFILES.find((r) => r.value === riskProfile)?.label || 'Moderado'} />
                <ProfileSummary label="Ativos" value={selectedAssets.join(', ') || '—'} />
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lgpdConsent}
                    onChange={(e) => setLgpdConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border/50"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Autorizo o tratamento dos meus dados pessoais para personalização da experiência no SUSE,
                    conforme a <strong>LGPD (Lei 13.709/2018)</strong>. Posso solicitar exclusão a qualquer momento.
                  </span>
                </label>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Como o SUSE se adaptou para você</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {adjustExperienceLevel() === 'BEGINNER' && 'Interface simplificada, apenas sinais de alta confiança, explicações didáticas e alertas essenciais.'}
                  {adjustExperienceLevel() === 'INTERMEDIATE' && 'Interface equilibrada com todos os recursos, sinais padrão e explicações técnicas.'}
                  {(adjustExperienceLevel() === 'ADVANCED' || adjustExperienceLevel() === 'PROFESSIONAL') && 'Interface densa e customizável, sinais com confiança ajustável, SHAP detalhado e alertas personalizados.'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-destructive bg-destructive/10 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-6 mt-auto">
            <button
              onClick={prev}
              disabled={step === 0 || saving}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              onClick={next}
              disabled={!canProceed() || saving}
              className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === totalSteps - 1 ? 'Começar a usar o SUSE' : 'Continuar'}
              {step < totalSteps - 1 && <ChevronRight className="w-4 h-4" />}
              {step === totalSteps - 1 && <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StyleCard({
  icon: Icon, label, desc, badge, selected, onClick,
}: {
  icon: LucideIcon; label: string; desc: string; badge: string;
  selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border text-left transition',
        selected ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-border'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', selected ? 'bg-primary/20' : 'bg-secondary/20')}>
          <Icon className={cn('w-5 h-5', selected ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/40 text-muted-foreground font-mono">
              {badge}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
      </div>
    </button>
  );
}

function ValidationQuestion({
  question, value, onChange,
}: {
  question: string; value: boolean | null; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-foreground/90">{question}</p>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={() => onChange(true)}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-medium transition',
            value === true ? 'bg-signal-buy/20 text-signal-buy' : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
          )}
        >
          Sim
        </button>
        <button
          onClick={() => onChange(false)}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-medium transition',
            value === false ? 'bg-signal-sell/20 text-signal-sell' : 'bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
          )}
        >
          Não
        </button>
      </div>
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition border',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function ProfileSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
