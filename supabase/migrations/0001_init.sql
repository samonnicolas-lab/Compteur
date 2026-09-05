-- Compteur — schéma initial
-- À exécuter dans l'éditeur SQL de votre projet Supabase (ou via `supabase db push`).
-- Ce script est idempotent : vous pouvez le relancer sans erreur si une exécution
-- précédente a été interrompue en cours de route.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Les profils sont visibles par tous les utilisateurs connectés" on public.profiles;
create policy "Les profils sont visibles par tous les utilisateurs connectés"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Un utilisateur peut créer son propre profil" on public.profiles;
create policy "Un utilisateur peut créer son propre profil"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Un utilisateur peut modifier son propre profil" on public.profiles;
create policy "Un utilisateur peut modifier son propre profil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Crée automatiquement un profil (pseudo depuis les métadonnées d'inscription) à la création du compte.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'pseudo', 'Utilisateur' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- sounds (bibliothèque de sons, préchargée — voir aussi assets/sounds côté app)
-- ---------------------------------------------------------------------------
create table if not exists public.sounds (
  id text primary key,
  label text not null,
  file_asset text not null
);

alter table public.sounds enable row level security;

drop policy if exists "La bibliothèque de sons est publique en lecture" on public.sounds;
create policy "La bibliothèque de sons est publique en lecture"
  on public.sounds for select
  to authenticated
  using (true);

insert into public.sounds (id, label, file_asset) values
  ('cloche', 'Cloche', 'cloche.wav'),
  ('clic', 'Clic mécanique', 'clic.wav'),
  ('bip', 'Bip électronique', 'bip.wav'),
  ('applaudissement', 'Applaudissement', 'applaudissement.wav'),
  ('tambour', 'Tambour', 'tambour.wav'),
  ('aboiement', 'Aboiement', 'aboiement.wav')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------
create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

-- Fonction utilitaire (security definer) pour éviter la récursion RLS entre groups/group_members.
create or replace function public.is_member_of_group(p_group_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

drop policy if exists "Un membre voit les groupes dont il fait partie" on public.groups;
create policy "Un membre voit les groupes dont il fait partie"
  on public.groups for select
  to authenticated
  using (owner_id = auth.uid() or public.is_member_of_group(id));

drop policy if exists "Un utilisateur peut créer un groupe" on public.groups;
create policy "Un utilisateur peut créer un groupe"
  on public.groups for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Un membre voit la liste des membres de ses groupes" on public.group_members;
create policy "Un membre voit la liste des membres de ses groupes"
  on public.group_members for select
  to authenticated
  using (public.is_member_of_group(group_id));

drop policy if exists "Un utilisateur peut rejoindre un groupe (s'ajouter lui-même)" on public.group_members;
create policy "Un utilisateur peut rejoindre un groupe (s'ajouter lui-même)"
  on public.group_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- counters
-- ---------------------------------------------------------------------------
create table if not exists public.counters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  emoji text not null,
  sound_id text not null references public.sounds (id),
  geoloc_enabled boolean not null default false,
  photo_enabled boolean not null default false,
  group_id uuid references public.groups (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.counters enable row level security;

drop policy if exists "Un utilisateur voit ses compteurs et ceux de ses groupes" on public.counters;
create policy "Un utilisateur voit ses compteurs et ceux de ses groupes"
  on public.counters for select
  to authenticated
  using (
    owner_id = auth.uid()
    or (group_id is not null and public.is_member_of_group(group_id))
  );

drop policy if exists "Un utilisateur peut créer ses propres compteurs" on public.counters;
create policy "Un utilisateur peut créer ses propres compteurs"
  on public.counters for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Un utilisateur peut modifier ses propres compteurs" on public.counters;
create policy "Un utilisateur peut modifier ses propres compteurs"
  on public.counters for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Un utilisateur peut supprimer ses propres compteurs" on public.counters;
create policy "Un utilisateur peut supprimer ses propres compteurs"
  on public.counters for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- entries (chaque clic)
-- ---------------------------------------------------------------------------
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  counter_id uuid not null references public.counters (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  "timestamp" timestamptz not null default now(),
  lat double precision,
  lng double precision,
  accuracy double precision,
  photo_url text
);

create index if not exists entries_counter_id_idx on public.entries (counter_id);
create index if not exists entries_user_id_idx on public.entries (user_id);
create index if not exists entries_timestamp_idx on public.entries ("timestamp");

alter table public.entries enable row level security;

-- Un utilisateur voit les entrées des compteurs qu'il possède, ou des compteurs
-- partagés dans un groupe dont il est membre (nécessaire pour classements/carte communs).
drop policy if exists "Visibilité des entrées : propriétaire du compteur ou membre du groupe" on public.entries;
create policy "Visibilité des entrées : propriétaire du compteur ou membre du groupe"
  on public.entries for select
  to authenticated
  using (
    exists (
      select 1 from public.counters c
      where c.id = entries.counter_id
        and (
          c.owner_id = auth.uid()
          or (c.group_id is not null and public.is_member_of_group(c.group_id))
        )
    )
  );

drop policy if exists "Un utilisateur ajoute ses propres clics sur un compteur accessible" on public.entries;
create policy "Un utilisateur ajoute ses propres clics sur un compteur accessible"
  on public.entries for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.counters c
      where c.id = entries.counter_id
        and (
          c.owner_id = auth.uid()
          or (c.group_id is not null and public.is_member_of_group(c.group_id))
        )
    )
  );

-- Nécessaire pour compléter lat/lng en arrière-plan une fois la géolocalisation résolue
-- (l'entrée est d'abord enregistrée sans position, pour ne pas bloquer le clic).
drop policy if exists "Un utilisateur peut mettre à jour ses propres clics" on public.entries;
create policy "Un utilisateur peut mettre à jour ses propres clics"
  on public.entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Un utilisateur peut supprimer ses propres clics" on public.entries;
create policy "Un utilisateur peut supprimer ses propres clics"
  on public.entries for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage : bucket pour les photos des entrées
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('entry-photos', 'entry-photos', true)
on conflict (id) do nothing;

drop policy if exists "Photos des entrées lisibles publiquement" on storage.objects;
create policy "Photos des entrées lisibles publiquement"
  on storage.objects for select
  using (bucket_id = 'entry-photos');

drop policy if exists "Un utilisateur connecté peut déposer une photo dans son propre dossier" on storage.objects;
create policy "Un utilisateur connecté peut déposer une photo dans son propre dossier"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
