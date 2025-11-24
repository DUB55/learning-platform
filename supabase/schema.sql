  user_id uuid references public.profiles(id) not null,
  title text not null,
  color text default 'blue',
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chapters table
create table public.chapters (
  id uuid default gen_random_uuid() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create study_sessions table
create table public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  subject_id uuid references public.subjects(id) on delete set null,
  duration_seconds integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  due_date timestamp with time zone,
  type text check (type in ('test', 'review', 'assignment', 'deadline')),
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create resources table
create table public.resources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  type text check (type in ('pdf', 'link', 'video', 'image', 'other')),
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.study_sessions enable row level security;
alter table public.tasks enable row level security;
alter table public.resources enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Subjects policies
create policy "Users can view own or public subjects."
  on subjects for select
  using ( auth.uid() = user_id or is_public = true );

create policy "Users can insert own subjects."
  on subjects for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own subjects."
  on subjects for update
  using ( auth.uid() = user_id );

create policy "Users can delete own subjects."
  on subjects for delete
  using ( auth.uid() = user_id );

-- Chapters policies
create policy "Users can view chapters of own subjects."
  on chapters for select
  using ( exists ( select 1 from subjects where id = chapters.subject_id and user_id = auth.uid() ) );

create policy "Users can insert chapters for own subjects."
  on chapters for insert
  with check ( exists ( select 1 from subjects where id = chapters.subject_id and user_id = auth.uid() ) );

create policy "Users can update chapters of own subjects."
  on chapters for update
  using ( exists ( select 1 from subjects where id = chapters.subject_id and user_id = auth.uid() ) );

create policy "Users can delete chapters of own subjects."
  on chapters for delete
  using ( exists ( select 1 from subjects where id = chapters.subject_id and user_id = auth.uid() ) );

-- Study Sessions policies
create policy "Users can view own study sessions."
  on study_sessions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own study sessions."
  on study_sessions for insert
  with check ( auth.uid() = user_id );

-- Tasks policies
create policy "Users can view own tasks."
  on tasks for select
  using ( auth.uid() = user_id );

-- Resources policies
create policy "Users can view own resources."
  on resources for select
  using ( auth.uid() = user_id );

create policy "Users can insert own resources."
  on resources for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own resources."
  on resources for update
  using ( auth.uid() = user_id );

create policy "Users can delete own resources."
  on resources for delete
  using ( auth.uid() = user_id );

create policy "Users can insert own tasks."
  on tasks for insert
  with check ( auth.uid() = user_id );

  after insert on auth.users
  for each row execute procedure public.handle_new_user();
