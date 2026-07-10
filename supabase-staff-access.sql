-- À exécuter dans Supabase → SQL Editor

-- Table qui stocke le code (NON lisible directement depuis le site : pas de policy SELECT)
create table staff_access (
  id int primary key default 1 check (id = 1),
  code text not null
);

insert into staff_access (id, code) values (1, 'melusia24');

alter table staff_access enable row level security;
-- Volontairement : aucune policy SELECT. La table est donc invisible via l'API publique.

-- Fonction de vérification : le navigateur envoie un code, la fonction répond juste vrai/faux.
-- Le vrai code ne transite jamais vers le client.
create or replace function verifier_code_staff(code_saisi text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff_access where code = code_saisi
  );
$$;

-- Autorise le site (clé anonyme) à appeler cette fonction, sans donner accès à la table
grant execute on function verifier_code_staff(text) to anon;

-- Pour changer le code plus tard, exécute simplement :
-- update staff_access set code = 'nouveau_code' where id = 1;
