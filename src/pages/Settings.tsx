import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2, Check, ChevronLeft, TrendingUp, Clock, Target, Zap, Compass,
  Shield, AlertTriangle, Trash2, Save, LogOut, User, Sliders, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TRADING_STYLES = [
  { value: 'DAY', label: 'Day Trader', icon: Zap, timeframe: 'M5/M15' },
  { value: 'SWING', label: 'Swing Trader', icon: Clock, timeframe: 'H1/H4' },
  { value: 'POSITION', label: 'Position', icon: Target, timeframe: 'D1/W1' },
  { value: 'SCALP', label: 'Scalper', icon: TrendingUp, timeframe: 'M1/M5' },
  { value: 'MIXED', label: 'Misto', icon: Compass, timeframe: 'M15/H1' },
  { value: 'EXPLORING', label: 'Explorando', icon: Compass, timeframe: 'M15' },
];

const EXPERIENCE_LEVELS = [
  { value: 'BEGINNER', label: 'Iniciante', desc: 'Menos de 1 ano ou demo' },
  { value: 'INTERMEDIATE', label: 'Intermediário', desc: '1 a 4 anos, capital real' },
  { value: 'ADVANCED', label: 'Avançado', desc: 'Mais de 4 anos, estratégias próprias' },
  { value: 'PROFESSIONAL', label: 'Profissional', desc: 'Vive de trading' },
];

const ASSETS = ['Forex', 'Índices', 'Ações BR', 'Cripto', 'Commodities', 'Futuros'];
const PLATFORMS = ['MetaTrader 5', 'Profit', 'TradingView', 'NinjaTrader', 'Nenhuma ainda'];
const RISK_PROFILES = [
  { value: 'CONSERVADOR', label: 'Conservador' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'AGRESSIVO', label: 'Agressivo' },
];

type Tab = 'profile' | 'preferences' | 'lgpd';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [tradingStyle, setTradingStyle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [stopLossHabit, setStopLossHabit] = useState<boolean | null>(null);
  const [drawdownExperience, setDrawdownExperience] = useState<boolean | null>(null);
  const [hasTradingPlan, setHasTradingPlan] = useState<boolean | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [riskProfile, setRiskProfile] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCountry(profile.country || 'Brasil');
      setTimezone(profile.timezone || 'America/Sao_Paulo');
      setTradingStyle(profile.trading_style || '');
      setExperienceLevel(profile.experience_level || '');
      setStopLossHabit(profile.stop_loss_habit);
      setDrawdownExperience(profile.drawdown_experience);
      setHasTradingPlan(profile.has_trading_plan);
      setSelectedAssets(profile.preferred_assets || []);
      setSelectedPlatforms(profile.platforms_used || []);
      setRiskProfile(profile.risk_profile || '');
      setLgpdConsent(profile.lgpd_consent);
    }
  }, [profile]);

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const styleData = TRADING_STYLES.find((s) => s.value === tradingStyle);
      const defaultTimeframes = styleData ? [styleData.timeframe] : ['M15'];

      const { error: updateError } = await supabase
        .from('trader_profiles')
        .update({
          full_name: fullName || null,
          country,
          timezone,
          trading_style: tradingStyle,
          experience_level: experienceLevel,
          risk_profile: riskProfile || 'MODERADO',
          preferred_timeframes: defaultTimeframes,
          preferred_assets: selectedAssets,
          platforms_used: selectedPlatforms,
          stop_loss_habit: stopLossHabit,
          drawdown_experience: drawdownExperience,
          has_trading_plan: hasTradingPlan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawConsent = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('trader_profiles')
        .update({
          lgpd_consent: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setLgpdConsent(false);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao revogar consentimento');
    } finally {
      setSaving(false);
    }
  };

  const handleRegrantConsent = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('trader_profiles')
        .update({
          lgpd_consent: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setLgpdConsent(true);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conceder consentimento');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmText !== 'EXCLUIR') return;
    setDeleting(true);
    setError(null);

    try {
      const { error: profileError } = await supabase
        .from('trader_profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) {
        await signOut();
        navigate('/login');
        return;
      }

      await signOut();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta');
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
    } finally {
      setDeleting(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'preferences', label: 'Preferências', icon: Sliders },
    { id: 'lgpd', label: 'LGPD', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gerencie seu perfil, preferências e dados pessoais
        </p>

        <div className="flex gap-1 p-1 bg-secondary/20 rounded-lg mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {saved && (
          <div className="mb-4 text-sm text-green-600 bg-green-500/10 rounded-lg p-3 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            Alterações salvas com sucesso
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-6">
            <Section title="Dados pessoais">
              <Field label="Nome completo">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-base"
                  placeholder="Seu nome"
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="input-base opacity-60"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="País">
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input-base"
                  />
                </Field>
                <Field label="Fuso horário">
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="input-base"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Estilo de trading">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRADING_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setTradingStyle(style.value)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition',
                      tradingStyle === style.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-border'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <style.icon className={cn('w-4 h-4', tradingStyle === style.value ? 'text-primary' : 'text-muted-foreground')} />
                      <p className="text-sm font-semibold text-foreground">{style.label}</p>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">{style.timeframe}</p>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Nível de experiência">
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

              <div className="pt-4 border-t border-border/50 space-y-3 mt-4">
                <BoolRow label="Uso stop loss em 100% das operações" value={stopLossHabit} onChange={setStopLossHabit} />
                <BoolRow label="Já passei por drawdown > 15%" value={drawdownExperience} onChange={setDrawdownExperience} />
                <BoolRow label="Possuo plano de trading escrito" value={hasTradingPlan} onChange={setHasTradingPlan} />
              </div>
            </Section>

            <SaveBar onSave={handleSave} saving={saving} />
          </div>
        )}

        {tab === 'preferences' && (
          <div className="space-y-6">
            <Section title="Ativos de interesse">
              <div className="flex flex-wrap gap-2">
                {ASSETS.map((asset) => (
                  <Chip key={asset} label={asset} selected={selectedAssets.includes(asset)} onClick={() => setSelectedAssets((arr) => toggleArrayItem(arr, asset))} />
                ))}
              </div>
            </Section>

            <Section title="Plataformas">
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <Chip key={p} label={p} selected={selectedPlatforms.includes(p)} onClick={() => setSelectedPlatforms((arr) => toggleArrayItem(arr, p))} />
                ))}
              </div>
            </Section>

            <Section title="Perfil de risco">
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
                  </button>
                ))}
              </div>
            </Section>

            <SaveBar onSave={handleSave} saving={saving} />
          </div>
        )}

        {tab === 'lgpd' && (
          <div className="space-y-6">
            <Section title="Consentimento LGPD" icon={Shield}>
              <div className={cn(
                'p-4 rounded-lg border',
                lgpdConsent ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
              )}>
                <div className="flex items-start gap-3">
                  <Shield className={cn('w-5 h-5 mt-0.5', lgpdConsent ? 'text-green-600' : 'text-yellow-600')} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {lgpdConsent ? 'Consentimento ativo' : 'Consentimento revogado'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {lgpdConsent
                        ? 'Você autorizou o tratamento dos seus dados para personalização da experiência no SUSE, conforme a Lei 13.709/2018 (LGPD).'
                        : 'Seu consentimento está revogado. O SUSE não utilizará seus dados para personalização. Você pode reativar a qualquer momento.'}
                    </p>
                    {lgpdConsent ? (
                      <button
                        onClick={handleWithdrawConsent}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 transition"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Revogar consentimento'}
                      </button>
                    ) : (
                      <button
                        onClick={handleRegrantConsent}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-700 hover:bg-green-500/30 transition"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conceder consentimento'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Seus direitos" icon={ShieldAlert}>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Como titular dos dados, você tem direito a:</p>
                <ul className="space-y-1.5 ml-4">
                  <li>- <strong className="text-foreground">Acessar</strong> seus dados pessoais</li>
                  <li>- <strong className="text-foreground">Corrigir</strong> dados incompletos ou inexatos</li>
                  <li>- <strong className="text-foreground">Revogar consentimento</strong> a qualquer momento</li>
                  <li>- <strong className="text-foreground">Solicitar exclusão</strong> dos seus dados</li>
                </ul>
              </div>
            </Section>

            <Section title="Exclusão de conta" icon={Trash2}>
              <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Zona de perigo</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A exclusão da conta é <strong>permanente e irreversível</strong>. Todos os seus dados
                      (perfil, preferências, histórico) serão removidos. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>

                {!deleteConfirmOpen ? (
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir minha conta
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground">
                      Para confirmar, digite <strong className="font-mono text-destructive">EXCLUIR</strong> abaixo:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="input-base font-mono"
                      placeholder="EXCLUIR"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'EXCLUIR' || deleting}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Confirmar exclusão permanente
                      </button>
                      <button
                        onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Sessão">
              <button
                onClick={async () => { await signOut(); navigate('/login'); }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof User; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function BoolRow({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-foreground/90">{label}</p>
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

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="sticky bottom-4 z-10">
      <div className="glass-panel rounded-xl border border-border/50 p-3 flex items-center justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar alterações
        </button>
      </div>
    </div>
  );
}
