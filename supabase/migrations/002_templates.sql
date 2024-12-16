-- Create the templates table
create table public.templates (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    description text,
    content text not null,
    content_type text not null,
    tone text not null,
    length text not null,
    metadata jsonb default '{}'::jsonb,
    is_public boolean default false,
    version integer default 1,
    tags text[] default array[]::text[]
);

-- Create the template_categories table
create table public.template_categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create the template_category_assignments table
create table public.template_category_assignments (
    template_id uuid references public.templates(id) on delete cascade,
    category_id uuid references public.template_categories(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (template_id, category_id)
);

-- Set up Row Level Security (RLS)
alter table public.templates enable row level security;
alter table public.template_categories enable row level security;
alter table public.template_category_assignments enable row level security;

-- Create policies for templates
create policy "Users can view public templates and their own templates"
    on public.templates for select
    using (is_public or auth.uid() = user_id);

create policy "Users can create their own templates"
    on public.templates for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own templates"
    on public.templates for update
    using (auth.uid() = user_id);

create policy "Users can delete their own templates"
    on public.templates for delete
    using (auth.uid() = user_id);

-- Create policies for template categories (admin only)
create policy "Anyone can view template categories"
    on public.template_categories for select
    using (true);

create policy "Only admins can manage template categories"
    on public.template_categories
    using (exists (
        select 1 from public.admin_users
        where user_id = auth.uid()
    ));

-- Create policies for template category assignments
create policy "Anyone can view template category assignments"
    on public.template_category_assignments for select
    using (true);

create policy "Only template owners can manage category assignments"
    on public.template_category_assignments
    using (
        exists (
            select 1 from public.templates t
            where t.id = template_id
            and t.user_id = auth.uid()
        )
    );

-- Create function to handle updated_at
create trigger handle_templates_updated_at
    before update on public.templates
    for each row
    execute function public.handle_updated_at();

-- Insert default template categories
insert into public.template_categories (name, description) values
    ('Blog Posts', 'Templates for various types of blog posts'),
    ('Social Media', 'Templates for social media posts and updates'),
    ('Marketing', 'Templates for marketing materials and campaigns'),
    ('SEO', 'Templates optimized for search engines'),
    ('Email', 'Templates for email marketing and newsletters'),
    ('Product', 'Templates for product descriptions and features'),
    ('Technical', 'Templates for technical documentation and guides'); 