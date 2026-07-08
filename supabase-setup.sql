-- À exécuter dans Supabase → SQL Editor

create table comptes (
  id bigint generated always as identity primary key,
  titre text not null,
  texte text not null,
  lien_audio text,
  created_at timestamptz default now()
);

-- Sécurité : active RLS (Row Level Security)
alter table comptes enable row level security;

-- Politiques temporaires "ouvertes" (à restreindre plus tard avec l'authentification Staff)
create policy "Public read" on comptes
  for select using (true);

create policy "Public insert" on comptes
  for insert with check (true);

create policy "Public delete" on comptes
  for delete using (true);

-- Table pour le contenu du site (édition depuis /staff)
create table site_content (
  id int primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table site_content enable row level security;

create policy "Public read content" on site_content
  for select using (true);

create policy "Public upsert content" on site_content
  for insert with check (true);

create policy "Public update content" on site_content
  for update using (true);

-- Ligne initiale (vide = le site garde ses textes par défaut tant que rien n'est modifié)
insert into site_content (id, content) values (1, '{}'::jsonb);

