-- Create the collaborators table
create table public.collaborators (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    draft_id uuid references public.drafts(id) on delete cascade not null,
    role text not null check (role in ('viewer', 'editor', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (user_id, draft_id)
);

-- Create the comments table
create table public.comments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    draft_id uuid references public.drafts(id) on delete cascade not null,
    parent_id uuid references public.comments(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved boolean default false,
    resolved_by uuid references auth.users(id) on delete set null,
    resolved_at timestamp with time zone
);

-- Create the draft_versions table for version history
create table public.draft_versions (
    id uuid primary key default uuid_generate_v4(),
    draft_id uuid references public.drafts(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    metadata jsonb default '{}'::jsonb,
    version_number integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (draft_id, version_number)
);

-- Create the draft_shares table for public sharing
create table public.draft_shares (
    id uuid primary key default uuid_generate_v4(),
    draft_id uuid references public.drafts(id) on delete cascade not null,
    created_by uuid references auth.users(id) on delete cascade not null,
    access_token text not null unique,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_active boolean default true
);

-- Set up Row Level Security (RLS)
alter table public.collaborators enable row level security;
alter table public.comments enable row level security;
alter table public.draft_versions enable row level security;
alter table public.draft_shares enable row level security;

-- Create policies for collaborators
create policy "Users can view drafts they collaborate on"
    on public.drafts for select
    using (
        exists (
            select 1 from public.collaborators c
            where c.draft_id = id
            and c.user_id = auth.uid()
        )
    );

create policy "Users can view their collaborations"
    on public.collaborators for select
    using (
        user_id = auth.uid() or
        exists (
            select 1 from public.drafts d
            where d.id = draft_id
            and d.user_id = auth.uid()
        )
    );

create policy "Draft owners can manage collaborators"
    on public.collaborators
    using (
        exists (
            select 1 from public.drafts d
            where d.id = draft_id
            and d.user_id = auth.uid()
        )
    );

-- Create policies for comments
create policy "Users can view comments on drafts they have access to"
    on public.comments for select
    using (
        exists (
            select 1 from public.drafts d
            left join public.collaborators c on c.draft_id = d.id
            where d.id = draft_id
            and (d.user_id = auth.uid() or c.user_id = auth.uid())
        )
    );

create policy "Users can create comments on drafts they have access to"
    on public.comments for insert
    with check (
        exists (
            select 1 from public.drafts d
            left join public.collaborators c on c.draft_id = d.id
            where d.id = draft_id
            and (d.user_id = auth.uid() or c.user_id = auth.uid())
        )
    );

create policy "Users can update their own comments"
    on public.comments for update
    using (user_id = auth.uid());

create policy "Users can delete their own comments"
    on public.comments for delete
    using (user_id = auth.uid());

-- Create policies for draft versions
create policy "Users can view versions of drafts they have access to"
    on public.draft_versions for select
    using (
        exists (
            select 1 from public.drafts d
            left join public.collaborators c on c.draft_id = d.id
            where d.id = draft_id
            and (d.user_id = auth.uid() or c.user_id = auth.uid())
        )
    );

create policy "Users can create versions of drafts they can edit"
    on public.draft_versions for insert
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

-- Create policies for draft shares
create policy "Users can view shares for drafts they own or collaborate on"
    on public.draft_shares for select
    using (
        exists (
            select 1 from public.drafts d
            left join public.collaborators c on c.draft_id = d.id
            where d.id = draft_id
            and (d.user_id = auth.uid() or c.user_id = auth.uid())
        )
    );

create policy "Users can create shares for drafts they own or admin"
    on public.draft_shares for insert
    with check (
        exists (
            select 1 from public.drafts d
            left join public.collaborators c on c.draft_id = d.id
            where d.id = draft_id
            and (
                d.user_id = auth.uid() or
                (c.user_id = auth.uid() and c.role = 'admin')
            )
        )
    );

create policy "Users can manage shares they created"
    on public.draft_shares
    using (created_by = auth.uid());

-- Create function to handle updated_at
create trigger handle_collaborators_updated_at
    before update on public.collaborators
    for each row
    execute function public.handle_updated_at();

create trigger handle_comments_updated_at
    before update on public.comments
    for each row
    execute function public.handle_updated_at();

create trigger handle_draft_shares_updated_at
    before update on public.draft_shares
    for each row
    execute function public.handle_updated_at();

-- Create function to create initial version when a draft is created
create or replace function public.handle_draft_version()
returns trigger as $$
begin
    insert into public.draft_versions (
        draft_id,
        user_id,
        content,
        metadata,
        version_number
    ) values (
        new.id,
        new.user_id,
        new.content,
        new.metadata,
        1
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to create initial version
create trigger create_initial_version
    after insert on public.drafts
    for each row
    execute function public.handle_draft_version();

-- Create function to create new version when content is updated
create or replace function public.handle_draft_update()
returns trigger as $$
declare
    last_version integer;
begin
    if old.content = new.content then
        return new;
    end if;

    select coalesce(max(version_number), 0) + 1
    into last_version
    from public.draft_versions
    where draft_id = new.id;

    insert into public.draft_versions (
        draft_id,
        user_id,
        content,
        metadata,
        version_number
    ) values (
        new.id,
        auth.uid(),
        new.content,
        new.metadata,
        last_version
    );

    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to create new version on content update
create trigger create_new_version
    after update of content on public.drafts
    for each row
    execute function public.handle_draft_update(); 