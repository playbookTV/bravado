-- Enable the necessary extensions
create extension if not exists "uuid-ossp";

-- Create the drafts table
create table public.drafts (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    content text not null,
    content_type text not null,
    tone text not null,
    length text not null,
    metadata jsonb default '{}'::jsonb,
    is_published boolean default false,
    version integer default 1
);

-- Create the user_preferences table
create table public.user_preferences (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null unique,
    default_tone text default 'formal',
    default_length text default 'medium',
    default_content_type text default 'blog',
    theme text default 'system',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.drafts enable row level security;
alter table public.user_preferences enable row level security;

-- Create policies for drafts
create policy "Users can view their own drafts"
    on public.drafts for select
    using (auth.uid() = user_id);

create policy "Users can create their own drafts"
    on public.drafts for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
    on public.drafts for update
    using (auth.uid() = user_id);

create policy "Users can delete their own drafts"
    on public.drafts for delete
    using (auth.uid() = user_id);

-- Create policies for user_preferences
create policy "Users can view their own preferences"
    on public.user_preferences for select
    using (auth.uid() = user_id);

create policy "Users can create their own preferences"
    on public.user_preferences for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
    on public.user_preferences for update
    using (auth.uid() = user_id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_drafts_updated_at
    before update on public.drafts
    for each row
    execute function public.handle_updated_at();

create trigger handle_user_preferences_updated_at
    before update on public.user_preferences
    for each row
    execute function public.handle_updated_at(); 