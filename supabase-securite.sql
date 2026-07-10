-- ============================================================
-- SÉCURISATION DU SITE — à exécuter dans Supabase → SQL Editor
-- ============================================================
-- Avant : n'importe qui connaissant l'URL + la clé publique Supabase
-- pouvait ajouter/supprimer du contenu directement via l'API, sans
-- jamais passer par le code d'accès Staff.
--
-- Après : toute écriture (ajout/suppression) doit passer par une
-- fonction qui vérifie le code Staff côté serveur. Impossible de
-- contourner en appelant l'API directement.
-- ============================================================

-- 1. Retirer les règles d'écriture publiques existantes
drop policy if exists "Public insert" on contes;
drop policy if exists "Public delete" on contes;
drop policy if exists "Public insert blocs" on blocs;
drop policy if exists "Public delete blocs" on blocs;
drop policy if exists "Public upsert content" on site_content;
drop policy if exists "Public update content" on site_content;
-- (la lecture "select" reste publique : les pages du site doivent pouvoir afficher le contenu)

-- 2. Fonctions sécurisées pour les CONTES

create or replace function inserer_conte(
  p_titre text, p_texte text, p_lien_audio text, p_fichier_audio text, p_code text
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
begin
  if not exists (select 1 from staff_access where code = p_code) then
    raise exception 'Code d''accès incorrect';
  end if;
  insert into contes (titre, texte, lien_audio, fichier_audio)
  values (p_titre, p_texte, p_lien_audio, p_fichier_audio)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function inserer_conte(text,text,text,text,text) to anon;

create or replace function supprimer_conte(p_id bigint, p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from staff_access where code = p_code) then
    raise exception 'Code d''accès incorrect';
  end if;
  delete from contes where id = p_id;
  return true;
end;
$$;
grant execute on function supprimer_conte(bigint, text) to anon;

-- 3. Fonctions sécurisées pour les BLOCS (Spectacles / Le + de Pascale)

create or replace function inserer_bloc(
  p_categorie text, p_type text, p_titre text, p_texte text, p_url text, p_fichier text, p_code text
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
begin
  if not exists (select 1 from staff_access where code = p_code) then
    raise exception 'Code d''accès incorrect';
  end if;
  insert into blocs (categorie, type, titre, texte, url, fichier)
  values (p_categorie, p_type, p_titre, p_texte, p_url, p_fichier)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function inserer_bloc(text,text,text,text,text,text,text) to anon;

create or replace function supprimer_bloc(p_id bigint, p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from staff_access where code = p_code) then
    raise exception 'Code d''accès incorrect';
  end if;
  delete from blocs where id = p_id;
  return true;
end;
$$;
grant execute on function supprimer_bloc(bigint, text) to anon;

-- 4. Fonction sécurisée pour le CONTENU DU SITE (textes modifiables)

create or replace function maj_site_content(p_content jsonb, p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from staff_access where code = p_code) then
    raise exception 'Code d''accès incorrect';
  end if;
  insert into site_content (id, content, updated_at) values (1, p_content, now())
  on conflict (id) do update set content = excluded.content, updated_at = now();
  return true;
end;
$$;
grant execute on function maj_site_content(jsonb, text) to anon;
