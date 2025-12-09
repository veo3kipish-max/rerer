-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  auth_provider text not null,
  auth_id text not null,
  name text,
  email text,
  avatar_url text,
  credits integer default 5,
  subscription_tier text default 'free',
  subscription_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(auth_provider, auth_id)
);

-- PAYMENTS TABLE
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  type text not null, -- 'subscription' or 'credits'
  amount numeric not null,
  currency text default 'UAH',
  tier text,
  credits integer,
  telegram_payment_id text,
  telegram_charge_id text,
  status text default 'pending', -- 'pending', 'completed', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  
  -- Constraints
  CONSTRAINT check_payment_type CHECK (
    (type = 'subscription' AND tier IS NOT NULL) 
    OR 
    (type = 'credits' AND tier IS NULL AND credits IS NOT NULL)
  )
);

-- GENERATIONS TABLE
create table public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  mode text not null, -- 'selfie', 'photoshoot', 'replicate'
  image_count integer not null,
  quality text default 'sd',
  priority text default 'normal',
  status text default 'queued', -- 'queued', 'processing', 'completed', 'failed'
  credits_used integer default 0,
  result_urls text[],
  error_message text,
  queued_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUBSCRIPTION PLANS (Optional, for reference)
create table public.subscription_plans (
  id text primary key,
  name text not null,
  monthly_price_uah integer not null,
  credits_per_month integer not null,
  features text[]
);

insert into public.subscription_plans (id, name, monthly_price_uah, credits_per_month, features) values
('free', 'Free', 0, 5, ARRAY['SD Quality', 'Standard Queue']),
('light', 'Light', 49, 30, ARRAY['SD Quality', 'Standard Queue']),
('pro', 'Pro', 149, 100, ARRAY['HD Quality', 'Priority Queue', 'FaceID']),
('ultra', 'Ultra', 299, 300, ARRAY['UHD Quality', 'Max Queue', 'FaceID']);

-- CREDIT PACKAGES (Optional, for reference)
create table public.credit_packages (
  id text primary key,
  credits integer not null,
  price_uah integer not null,
  label text
);

insert into public.credit_packages (id, credits, price_uah, label) values
('pack_1', 1, 15, '1 Photo'),
('pack_5', 5, 49, '5 Photos'),
('pack_15', 15, 99, '15 Photos'),
('pack_50', 50, 249, '50 Photos');

-- FUNCTION: Check if user can generate
create or replace function public.can_generate(p_user_id uuid, p_credits_needed integer)
returns boolean
language plpgsql
security definer
as $$
declare
  v_credits integer;
begin
  select credits into v_credits from public.users where id = p_user_id;
  if v_credits >= p_credits_needed then
    return true;
  else
    return false;
  end if;
end;
$$;

-- FUNCTION: Deduct credits
create or replace function public.deduct_credits(p_user_id uuid, p_credits integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.users
  set credits = credits - p_credits
  where id = p_user_id;
end;
$$;

-- RLS POLICIES (Row Level Security)
alter table public.users enable row level security;
alter table public.payments enable row level security;
alter table public.generations enable row level security;

-- Allow public access for demo purposes (OR configure proper Auth policies later)
-- For now, we are managing auth via 'auth_id' lookup in code, so we can allow service_role to do everything
-- But since we use the client side, we need to allow access.
-- WARNING: These policies are permissive for the MVP. Secure them before scaling!

create policy "Enable read access for all users" on public.users for select using (true);
create policy "Enable insert for all users" on public.users for insert with check (true);
create policy "Enable update for all users" on public.users for update using (true);

create policy "Enable read access for all payments" on public.payments for select using (true);
create policy "Enable insert for all payments" on public.payments for insert with check (true);
create policy "Enable update for all payments" on public.payments for update using (true);

create policy "Enable read access for all generations" on public.generations for select using (true);
create policy "Enable insert for all generations" on public.generations for insert with check (true);
create policy "Enable update for all generations" on public.generations for update using (true);
