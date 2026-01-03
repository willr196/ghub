-- TRAVEL TABLE - Add this to your Supabase SQL Editor
-- Run this to add travel tracking functionality

-- Travel/Places visited table
create table public.travel (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  country text not null,
  city text not null,
  description text,
  highlights text,
  date_visited date,
  rating integer default 5 check (rating >= 1 and rating <= 5),
  would_return boolean default true,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.travel enable row level security;

-- Policies: Public can view public trips, owner can do everything
create policy "Anyone can view public travel entries" on public.travel
  for select using (is_public = true or auth.uid() = user_id);

create policy "Users can insert own travel entries" on public.travel
  for insert with check (auth.uid() = user_id);

create policy "Users can update own travel entries" on public.travel
  for update using (auth.uid() = user_id);

create policy "Users can delete own travel entries" on public.travel
  for delete using (auth.uid() = user_id);
