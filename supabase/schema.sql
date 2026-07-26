create table if not exists public.trader_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  country text default 'Brasil',
  timezone text default 'America/Sao_Paulo',
  language text default 'pt-BR',
  trading_style text,
  experience_level text,
  risk_profile text,
  preferred_timeframes text[] default '{}',
  preferred_assets text[] default '{}',
  platforms_used text[] default '{}',
  stop_loss_habit boolean,
  drawdown_experience boolean,
  has_trading_plan boolean,
  lgpd_consent boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trader_profiles enable row level security;

create policy "Users can view own profile"
  on public.trader_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.trader_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.trader_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.trader_profiles for delete
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.trader_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
