-- ============================================================
--  SPOKIY — схема базы данных для Supabase
--  Как применить: Supabase → SQL Editor → New query → вставить всё
--  это целиком → Run.
-- ============================================================

create table if not exists public.products (
  id                text primary key,
  pet               text not null check (pet in ('cat','dog','reptile','rodent')),
  sort              int  not null default 1,

  name_uk           text not null default '',
  name_en           text not null default '',
  material_uk       text not null default '',
  material_en       text not null default '',
  desc_uk           text not null default '',
  desc_en           text not null default '',

  min_length_cm     numeric not null default 20,
  max_length_cm     numeric not null default 60,
  base_price_uah    numeric not null default 1000,
  base_length_cm    numeric not null default 40,
  price_per_cm_uah  numeric not null default 30,

  in_stock          boolean not null default true,
  image             text not null default '',
  art               text not null default 'minimal'
);

create table if not exists public.orders (
  id           text primary key,
  created_at   timestamptz not null default now(),
  pet          text not null,
  weight_kg    numeric not null,
  first_name   text not null,
  last_name    text not null,
  phone        text not null,
  email        text not null,
  post_office  text not null,
  payment      text not null default 'transfer',
  comment      text not null default '',
  item         jsonb not null,
  status       text not null default 'new'
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists products_pet_sort_idx on public.products (pet, sort);

-- Доступ к таблицам только у сервера (service_role ключ обходит RLS).
-- Публичных политик нет намеренно: из браузера данные напрямую не читаются.
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- ============================================================
--  Хранилище фотографий
--  Storage → New bucket → имя: coffins → Public bucket: ВКЛ
-- ============================================================
insert into storage.buckets (id, name, public)
values ('coffins', 'coffins', true)
on conflict (id) do nothing;
