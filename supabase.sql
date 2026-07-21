-- Create transactions table with RLS
create table if not exists transactions (
  id text primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('income', 'expense')),
  amount real not null,
  category_id text,
  date text not null,
  note text,
  debt_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  foreign key (user_id) references auth.users(id) on delete cascade
);

-- Safe to re-run against an existing project: adds debt_id if the table predates this column.
alter table transactions add column if not exists debt_id text;

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

-- Create debts table with RLS
create table if not exists debts (
  id text primary key,
  user_id uuid not null,
  person_name text not null,
  amount real not null,
  type text not null check (type in ('lent', 'borrowed')),
  borrow_date text not null,
  payment_date text,
  is_settled boolean not null default false,
  note text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  foreign key (user_id) references auth.users(id) on delete cascade
);

alter table debts enable row level security;

create policy "Users can select own debts" on debts
  for select using (auth.uid() = user_id);

create policy "Users can insert own debts" on debts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own debts" on debts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete own debts" on debts
  for delete using (auth.uid() = user_id);

create index if not exists idx_debts_user_id on debts(user_id);
create index if not exists idx_debts_borrow_date on debts(borrow_date desc);
