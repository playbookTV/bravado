-- Create the publishing_platforms table
create table public.publishing_platforms (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    icon text,
    enabled boolean default true,
    config jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the user_publishing_connections table
create table public.user_publishing_connections (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    platform_id uuid references public.publishing_platforms(id) on delete cascade not null,
    platform_user_id text,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    metadata jsonb default '{}'::jsonb,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, platform_id)
);

-- Create the draft_publications table
create table public.draft_publications (
    id uuid primary key default uuid_generate_v4(),
    draft_id uuid references public.drafts(id) on delete cascade not null,
    connection_id uuid references public.user_publishing_connections(id) on delete cascade not null,
    platform_post_id text,
    platform_post_url text,
    status text not null check (status in ('pending', 'published', 'failed')),
    error_message text,
    metadata jsonb default '{}'::jsonb,
    scheduled_for timestamp with time zone,
    published_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.publishing_platforms enable row level security;
alter table public.user_publishing_connections enable row level security;
alter table public.draft_publications enable row level security;

-- Create policies for publishing_platforms
create policy "Anyone can view enabled publishing platforms"
    on public.publishing_platforms for select
    using (enabled = true);

create policy "Only admins can manage publishing platforms"
    on public.publishing_platforms
    using (auth.uid() in (select user_id from public.admin_users));

-- Create policies for user_publishing_connections
create policy "Users can view their own publishing connections"
    on public.user_publishing_connections for select
    using (user_id = auth.uid());

create policy "Users can manage their own publishing connections"
    on public.user_publishing_connections
    using (user_id = auth.uid());

-- Create policies for draft_publications
create policy "Users can view publications for drafts they have access to"
    on public.draft_publications for select
    using (
        exists (
            select 1 from public.drafts d
            left join public.collaborators c on c.draft_id = d.id
            where d.id = draft_id
            and (d.user_id = auth.uid() or c.user_id = auth.uid())
        )
    );

create policy "Users can create publications for drafts they can edit"
    on public.draft_publications for insert
    with check (
        exists (
            select 1 from public.drafts d
            left join public.collaborators c on c.draft_id = d.id
            where d.id = draft_id
            and (
                d.user_id = auth.uid() or
                (c.user_id = auth.uid() and c.role in ('editor', 'admin'))
            )
        )
    );

create policy "Users can manage their own publications"
    on public.draft_publications
    using (
        exists (
            select 1 from public.drafts d
            where d.id = draft_id
            and d.user_id = auth.uid()
        )
    );

-- Create function to handle updated_at
create trigger handle_user_publishing_connections_updated_at
    before update on public.user_publishing_connections
    for each row
    execute function public.handle_updated_at();

create trigger handle_draft_publications_updated_at
    before update on public.draft_publications
    for each row
    execute function public.handle_updated_at();

-- Insert default publishing platforms
insert into public.publishing_platforms (name, description, icon, config) values
    ('Medium', 'Publish articles on Medium', 'medium', '{
        "api_endpoint": "https://api.medium.com/v1",
        "scopes": ["basicProfile", "publishPost"],
        "content_types": ["blog"]
    }'::jsonb),
    ('WordPress', 'Publish to your WordPress site', 'wordpress', '{
        "api_endpoint": "https://public-api.wordpress.com/rest/v1.1",
        "scopes": ["posts"],
        "content_types": ["blog", "page"]
    }'::jsonb),
    ('LinkedIn', 'Share articles on LinkedIn', 'linkedin', '{
        "api_endpoint": "https://api.linkedin.com/v2",
        "scopes": ["w_member_social"],
        "content_types": ["blog", "social"]
    }'::jsonb),
    ('Dev.to', 'Publish articles on Dev.to', 'devto', '{
        "api_endpoint": "https://dev.to/api",
        "content_types": ["blog", "technical"]
    }'::jsonb),
    ('Hashnode', 'Publish articles on Hashnode', 'hashnode', '{
        "api_endpoint": "https://api.hashnode.com",
        "content_types": ["blog", "technical"]
    }'::jsonb),
    ('Ghost', 'Publish to your Ghost blog', 'ghost', '{
        "api_endpoint": "https://ghost.org/api/v3",
        "content_types": ["blog", "page"]
    }'::jsonb); 