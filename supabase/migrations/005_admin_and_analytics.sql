-- Create admin users table
create table public.admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('admin', 'super_admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete set null
);

-- Create usage metrics table
create table public.usage_metrics (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete set null,
    metric_type text not null,
    metric_value integer not null default 1,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create API rate limits table
create table public.api_rate_limits (
    user_id uuid primary key references auth.users(id) on delete cascade,
    daily_limit integer not null default 1000,
    monthly_limit integer not null default 10000,
    current_daily_usage integer not null default 0,
    current_monthly_usage integer not null default 0,
    last_reset_daily timestamp with time zone default timezone('utc'::text, now()),
    last_reset_monthly timestamp with time zone default timezone('utc'::text, now())
);

-- Set up Row Level Security (RLS)
alter table public.admin_users enable row level security;
alter table public.usage_metrics enable row level security;
alter table public.api_rate_limits enable row level security;

-- Create policies for admin_users
create policy "Only super admins can view admin users"
    on public.admin_users for select
    using (
        exists (
            select 1 from public.admin_users a
            where a.user_id = auth.uid()
            and a.role = 'super_admin'
        )
    );

create policy "Only super admins can manage admin users"
    on public.admin_users
    using (
        exists (
            select 1 from public.admin_users a
            where a.user_id = auth.uid()
            and a.role = 'super_admin'
        )
    );

-- Create policies for usage_metrics
create policy "Users can view their own metrics"
    on public.usage_metrics for select
    using (user_id = auth.uid());

create policy "Admins can view all metrics"
    on public.usage_metrics for select
    using (
        exists (
            select 1 from public.admin_users a
            where a.user_id = auth.uid()
        )
    );

-- Create policies for api_rate_limits
create policy "Users can view their own rate limits"
    on public.api_rate_limits for select
    using (user_id = auth.uid());

create policy "Admins can manage rate limits"
    on public.api_rate_limits
    using (
        exists (
            select 1 from public.admin_users a
            where a.user_id = auth.uid()
        )
    );

-- Create function to reset rate limits
create or replace function public.reset_rate_limits()
returns void as $$
declare
    current_time timestamp with time zone;
begin
    current_time := timezone('utc'::text, now());
    
    -- Reset daily limits
    update public.api_rate_limits
    set current_daily_usage = 0,
        last_reset_daily = current_time
    where extract(day from current_time - last_reset_daily) >= 1;
    
    -- Reset monthly limits
    update public.api_rate_limits
    set current_monthly_usage = 0,
        last_reset_monthly = current_time
    where extract(month from current_time - last_reset_monthly) >= 1;
end;
$$ language plpgsql security definer;

-- Create function to track metric
create or replace function public.track_metric(
    p_user_id uuid,
    p_metric_type text,
    p_metric_value integer default 1,
    p_metadata jsonb default '{}'::jsonb
)
returns void as $$
begin
    insert into public.usage_metrics (
        user_id,
        metric_type,
        metric_value,
        metadata
    ) values (
        p_user_id,
        p_metric_type,
        p_metric_value,
        p_metadata
    );
end;
$$ language plpgsql security definer;

-- Create function to check rate limit
create or replace function public.check_rate_limit(p_user_id uuid)
returns boolean as $$
declare
    rate_limit record;
begin
    -- Get or create rate limit record
    insert into public.api_rate_limits (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;
    
    select * into rate_limit
    from public.api_rate_limits
    where user_id = p_user_id;
    
    -- Check if limits are exceeded
    return (
        rate_limit.current_daily_usage < rate_limit.daily_limit
        and rate_limit.current_monthly_usage < rate_limit.monthly_limit
    );
end;
$$ language plpgsql security definer;

-- Insert initial super admin (replace with actual admin user ID)
-- insert into public.admin_users (user_id, role, created_by)
-- values ('REPLACE_WITH_ADMIN_UUID', 'super_admin', 'REPLACE_WITH_ADMIN_UUID'); 