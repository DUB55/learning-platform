-- Reset tables (WARNING: This will delete data in these tables)
drop table if exists public.tasks cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.chapters cascade;
drop table if exists public.subjects cascade;
drop table if exists public.profiles cascade;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Create subjects table
create table public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  color text default 'blue',
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

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.study_sessions enable row level security;
alter table public.tasks enable row level security;

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
create policy "Users can view own subjects."
  on subjects for select
  using ( auth.uid() = user_id );

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

create policy "Users can insert own tasks."
  on tasks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own tasks."
  on tasks for update
  using ( auth.uid() = user_id );

create policy "Users can delete own tasks."
  on tasks for delete
  using ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
