-- 在 Supabase SQL Editor 執行此 SQL 來建立資料表

create table expenses (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  category text not null,
  description text not null,
  amount numeric(10,2) not null,
  created_at timestamp with time zone default now()
);

-- 啟用 Row Level Security
alter table expenses enable row level security;

-- 允許所有操作（個人使用）
create policy "Allow all" on expenses for all using (true) with check (true);
