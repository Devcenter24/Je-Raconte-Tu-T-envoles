-- À exécuter dans Supabase → SQL Editor

create table blocs (
  id bigint generated always as identity primary key,
  categorie text not null,        -- 'spectacles_enfants' | 'spectacles_adultes' | 'pascale_plus'
  type text not null,             -- 'image' | 'texte' | 'audio' | 'lien' | 'separateur'
  titre text,                     -- légende / titre du lien (selon le type)
  texte text,                     -- contenu texte
  url text,                       -- lien externe ou lien audio
  fichier text,                   -- image ou audio encodé en base64 (data URI)
  created_at timestamptz default now()
);

alter table blocs enable row level security;

create policy "Public read blocs" on blocs
  for select using (true);

create policy "Public insert blocs" on blocs
  for insert with check (true);

create policy "Public delete blocs" on blocs
  for delete using (true);
