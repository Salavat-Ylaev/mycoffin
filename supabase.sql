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

  prices            jsonb not null default '{}'::jsonb,

  in_stock          boolean not null default true,
  image             text not null default '',
  art               text not null default 'minimal'
);

create table if not exists public.engraving_options (
  id          text primary key,
  sort        int  not null default 1,
  label_uk    text not null default '',
  label_en    text not null default '',
  hint_uk     text not null default '',
  hint_en     text not null default '',
  price_uah   numeric not null default 0,
  needs_text  boolean not null default false,
  enabled     boolean not null default true
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
  engraving    jsonb not null default '{"ids":[],"labels":[],"text":"","price_uah":0}'::jsonb,
  total_uah    numeric not null default 0,
  status       text not null default 'new'
);

-- если products создавалась раньше, со старой ценовой моделью
alter table public.products add column if not exists prices jsonb not null default '{}'::jsonb;
alter table public.products drop column if exists min_length_cm;
alter table public.products drop column if exists max_length_cm;
alter table public.products drop column if exists base_price_uah;
alter table public.products drop column if exists base_length_cm;
alter table public.products drop column if exists price_per_cm_uah;

-- на случай если таблица orders уже была создана раньше, без этих колонок
alter table public.orders add column if not exists engraving jsonb not null
  default '{"ids":[],"labels":[],"text":"","price_uah":0}'::jsonb;
alter table public.orders add column if not exists total_uah numeric not null default 0;
alter table public.orders drop column if exists category_id;

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists products_pet_sort_idx on public.products (pet, sort);

-- Доступ к таблицам только у сервера (service_role ключ обходит RLS).
-- Публичных политик нет намеренно: из браузера данные напрямую не читаются.
alter table public.products          enable row level security;
alter table public.orders            enable row level security;
alter table public.engraving_options enable row level security;

-- Стартовый набор платных услуг нанесения
insert into public.engraving_options (id, sort, label_uk, label_en, hint_uk, hint_en, price_uah, needs_text, enabled)
values
  ('name',   1, 'Ім''я улюбленця', 'Pet''s name',    'Гравіювання на кришці',                'Engraved on the lid',                 250, true,  true),
  ('dates',  2, 'Дати життя',      'Dates of life',  'Рік народження — рік прощання',        'Year of birth — year of farewell',    250, true,  true),
  ('emblem', 3, 'Емблема',         'Emblem',         'Лапка, серце, хрестик або свій знак',  'Paw, heart, cross or your own symbol',350, false, true),
  ('verse',  4, 'Посмертний вірш', 'Epitaph',        'Кілька рядків на ваш вибір або наш текст','A few lines of your choice, or ours',500, true,  true)
on conflict (id) do nothing;

-- ============================================================
--  Хранилище фотографий
--  Storage → New bucket → имя: coffins → Public bucket: ВКЛ
-- ============================================================
insert into storage.buckets (id, name, public)
values ('coffins', 'coffins', true)
on conflict (id) do nothing;
