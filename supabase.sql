-- Create transactions table with RLS
create table if not exists transactions (
  id text primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('income', 'expense')),
  amount real not null,
  category_id text,
  date text not null,
  note text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  foreign key (user_id) references auth.users(id) on delete cascade
);

-- Enable RLS
alter table transactions enable row level security;

-- Policy: Users can only select their own transactions
create policy "Users can select own transactions" on transactions
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
create policy "Users can insert own transactions" on transactions
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own transactions
create policy "Users can update own transactions" on transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own transactions
create policy "Users can delete own transactions" on transactions
  for delete
  using (auth.uid() = user_id);

-- Create index on user_id for faster queries
create index if not exists idx_transactions_user_id on transactions(user_id);

-- Create index on date for faster sorting
create index if not exists idx_transactions_date on transactions(date desc);
