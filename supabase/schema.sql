-- GHUB Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Profile table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workouts table
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null,
  duration integer, -- in minutes
  calories integer,
  notes text,
  exercises jsonb, -- array of exercises with sets/reps
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Measurements table
create table public.measurements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  weight decimal(5,2),
  chest decimal(5,2),
  waist decimal(5,2),
  hips decimal(5,2),
  arms decimal(5,2),
  thighs decimal(5,2),
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Log table
create table public.daily_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date default current_date unique,
  water_intake integer default 0, -- glasses
  sleep_hours decimal(3,1),
  sleep_quality integer, -- 1-5
  mood text, -- sad, meh, okay, good, great
  energy integer, -- 1-5
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Goals table
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target decimal(10,2) not null,
  current decimal(10,2) default 0,
  unit text,
  category text,
  completed boolean default false,
  target_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sobriety Tracking table
create table public.sobriety (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'alcohol' or 'smoking'
  start_date date not null,
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Recipes table
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text, -- Breakfast, Lunch, Dinner, Snacks, Smoothies
  description text,
  ingredients jsonb,
  instructions text,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  prep_time integer, -- minutes
  cook_time integer, -- minutes
  image_url text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blog Posts table
create table public.blog_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text,
  excerpt text,
  is_public boolean default true,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Media Gallery table
create table public.gallery (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'image' or 'video'
  url text not null,
  caption text,
  category text, -- Progress, Workouts, Meals, Achievements
  is_public boolean default false,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Library (saved routines)
create table public.workout_library (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  exercises jsonb not null,
  estimated_duration integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security Policies
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.measurements enable row level security;
alter table public.daily_logs enable row level security;
alter table public.goals enable row level security;
alter table public.sobriety enable row level security;
alter table public.recipes enable row level security;
alter table public.blog_posts enable row level security;
alter table public.gallery enable row level security;
alter table public.workout_library enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Workouts policies
create policy "Users can view own workouts" on public.workouts
  for select using (auth.uid() = user_id);
create policy "Users can insert own workouts" on public.workouts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts" on public.workouts
  for update using (auth.uid() = user_id);
create policy "Users can delete own workouts" on public.workouts
  for delete using (auth.uid() = user_id);

-- Measurements policies
create policy "Users can view own measurements" on public.measurements
  for select using (auth.uid() = user_id);
create policy "Users can insert own measurements" on public.measurements
  for insert with check (auth.uid() = user_id);
create policy "Users can update own measurements" on public.measurements
  for update using (auth.uid() = user_id);
create policy "Users can delete own measurements" on public.measurements
  for delete using (auth.uid() = user_id);

-- Daily logs policies
create policy "Users can view own daily logs" on public.daily_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own daily logs" on public.daily_logs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own daily logs" on public.daily_logs
  for update using (auth.uid() = user_id);
create policy "Users can delete own daily logs" on public.daily_logs
  for delete using (auth.uid() = user_id);

-- Goals policies
create policy "Users can view own goals" on public.goals
  for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals
  for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals
  for delete using (auth.uid() = user_id);

-- Sobriety policies
create policy "Users can view own sobriety" on public.sobriety
  for select using (auth.uid() = user_id);
create policy "Users can insert own sobriety" on public.sobriety
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sobriety" on public.sobriety
  for update using (auth.uid() = user_id);
create policy "Users can delete own sobriety" on public.sobriety
  for delete using (auth.uid() = user_id);

-- Recipes policies (public viewable, owner editable)
create policy "Anyone can view public recipes" on public.recipes
  for select using (is_public = true or auth.uid() = user_id);
create policy "Users can insert own recipes" on public.recipes
  for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes
  for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes
  for delete using (auth.uid() = user_id);

-- Blog posts policies (public viewable, owner editable)
create policy "Anyone can view public blog posts" on public.blog_posts
  for select using (is_public = true or auth.uid() = user_id);
create policy "Users can insert own blog posts" on public.blog_posts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own blog posts" on public.blog_posts
  for update using (auth.uid() = user_id);
create policy "Users can delete own blog posts" on public.blog_posts
  for delete using (auth.uid() = user_id);

-- Gallery policies (public viewable, owner editable)
create policy "Anyone can view public gallery items" on public.gallery
  for select using (is_public = true or auth.uid() = user_id);
create policy "Users can insert own gallery items" on public.gallery
  for insert with check (auth.uid() = user_id);
create policy "Users can update own gallery items" on public.gallery
  for update using (auth.uid() = user_id);
create policy "Users can delete own gallery items" on public.gallery
  for delete using (auth.uid() = user_id);

-- Workout library policies
create policy "Users can view own workout library" on public.workout_library
  for select using (auth.uid() = user_id);
create policy "Users can insert own workout library" on public.workout_library
  for insert with check (auth.uid() = user_id);
create policy "Users can update own workout library" on public.workout_library
  for update using (auth.uid() = user_id);
create policy "Users can delete own workout library" on public.workout_library
  for delete using (auth.uid() = user_id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();
create trigger update_daily_logs_updated_at before update on public.daily_logs
  for each row execute procedure public.update_updated_at_column();
create trigger update_blog_posts_updated_at before update on public.blog_posts
  for each row execute procedure public.update_updated_at_column();
