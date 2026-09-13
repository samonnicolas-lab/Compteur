import { supabase } from './supabase';
import { generateInviteCode } from './inviteCode';
import { Counter, CounterWithTotal, Entry, GroupMember, Profile, SoundId } from './types';

// La RLS de la table `counters` autorise aussi à voir les compteurs des autres
// membres d'un groupe partagé (nécessaire pour les classements croisés), donc
// on filtre explicitement sur owner_id ici : l'Accueil ne doit lister que les
// compteurs de l'utilisateur, pas ceux de ses coéquipiers.
export async function fetchMyCounters(ownerId: string): Promise<CounterWithTotal[]> {
  const { data: counters, error } = await supabase
    .from('counters')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const results: CounterWithTotal[] = [];
  for (const counter of counters ?? []) {
    const { count } = await supabase
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('counter_id', counter.id);

    let groupMemberCount: number | null = null;
    if (counter.group_id) {
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', counter.group_id);
      groupMemberCount = memberCount ?? 0;
    }

    results.push({
      ...(counter as Counter),
      total_entries: count ?? 0,
      group_member_count: groupMemberCount,
    });
  }
  return results;
}

export interface NewCounterInput {
  ownerId: string;
  name: string;
  emoji: string;
  soundId: SoundId;
  geolocEnabled: boolean;
  photoEnabled: boolean;
  groupId: string | null;
}

export async function createCounter(input: NewCounterInput): Promise<Counter> {
  const { data, error } = await supabase
    .from('counters')
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      emoji: input.emoji,
      sound_id: input.soundId,
      geoloc_enabled: input.geolocEnabled,
      photo_enabled: input.photoEnabled,
      group_id: input.groupId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Counter;
}

export async function createGroup(ownerId: string, name: string) {
  const { data, error } = await supabase
    .from('groups')
    .insert({ owner_id: ownerId, name, invite_code: generateInviteCode() })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('group_members').insert({ group_id: data.id, user_id: ownerId });
  return data;
}

export async function fetchGroupByInviteCode(inviteCode: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();
  if (error || !data) throw error ?? new Error('Code invalide');
  return data as { id: string; name: string; invite_code: string; owner_id: string };
}

// Reprend nom/emoji/son d'un compteur déjà existant du groupe, pour pré-remplir
// le formulaire de la personne qui rejoint (elle reste libre de les changer).
export async function fetchGroupCounterTemplate(groupId: string): Promise<Counter | null> {
  const { data, error } = await supabase
    .from('counters')
    .select('*')
    .eq('group_id', groupId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Counter) ?? null;
}

export async function joinGroupByInviteCode(userId: string, inviteCode: string) {
  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();
  if (error || !group) throw error ?? new Error('Code invalide');

  const { error: joinError } = await supabase
    .from('group_members')
    .upsert({ group_id: group.id, user_id: userId }, { onConflict: 'group_id,user_id' });
  if (joinError) throw joinError;

  return group;
}

export async function fetchGroupById(groupId: string) {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (error) throw error;
  return data as { id: string; name: string; invite_code: string; owner_id: string };
}

export async function updateCounterGroupId(counterId: string, groupId: string): Promise<void> {
  const { error } = await supabase.from('counters').update({ group_id: groupId }).eq('id', counterId);
  if (error) throw error;
}

// Le nom du groupe est une seule ligne en base, visible par tous ses
// membres : le renommer met à jour l'affichage pour tout le monde.
export async function updateGroupName(groupId: string, name: string): Promise<void> {
  const { error } = await supabase.from('groups').update({ name }).eq('id', groupId);
  if (error) throw error;
}

export async function updateCounterSettings(
  counterId: string,
  settings: { name: string; soundId: SoundId; geolocEnabled: boolean; photoEnabled: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('counters')
    .update({
      name: settings.name,
      sound_id: settings.soundId,
      geoloc_enabled: settings.geolocEnabled,
      photo_enabled: settings.photoEnabled,
    })
    .eq('id', counterId);
  if (error) throw error;
}

export async function fetchEntriesForGroup(groupId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*, counters!inner(group_id)')
    .eq('counters.group_id', groupId);
  if (error) throw error;
  return (data ?? []) as unknown as Entry[];
}

export async function fetchGroupMembers(groupId: string): Promise<(GroupMember & { profiles: Profile })[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(*)')
    .eq('group_id', groupId);
  if (error) throw error;
  return (data ?? []) as unknown as (GroupMember & { profiles: Profile })[];
}

export interface NewEntryInput {
  counterId: string;
  userId: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  photoUrl: string | null;
}

export async function insertEntry(input: NewEntryInput): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      counter_id: input.counterId,
      user_id: input.userId,
      lat: input.lat,
      lng: input.lng,
      accuracy: input.accuracy,
      photo_url: input.photoUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Entry;
}

export async function fetchCounterById(counterId: string): Promise<Counter> {
  const { data, error } = await supabase.from('counters').select('*').eq('id', counterId).single();
  if (error) throw error;
  return data as Counter;
}

export async function updateEntryLocation(
  entryId: string,
  lat: number,
  lng: number,
  accuracy: number | null
): Promise<void> {
  const { error } = await supabase.from('entries').update({ lat, lng, accuracy }).eq('id', entryId);
  if (error) throw error;
}

export async function fetchEntriesForCounter(counterId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('counter_id', counterId)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export interface EntryWithPseudo extends Entry {
  profiles: { pseudo: string } | null;
}

// Entrées à afficher sur la Carte : celles de tout le groupe (avec le pseudo
// de chaque auteur) si le compteur en fait partie, sinon seulement celles de
// ce compteur (compteur solo). La RLS de `entries` autorise déjà tout membre
// d'un groupe à voir les clics des compteurs du groupe.
export async function fetchEntriesForMap(counterId: string): Promise<EntryWithPseudo[]> {
  const counter = await fetchCounterById(counterId);

  if (counter.group_id) {
    const { data, error } = await supabase
      .from('entries')
      .select('*, counters!inner(group_id), profiles(pseudo)')
      .eq('counters.group_id', counter.group_id)
      .order('timestamp', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as EntryWithPseudo[];
  }

  const { data, error } = await supabase
    .from('entries')
    .select('*, profiles(pseudo)')
    .eq('counter_id', counterId)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as EntryWithPseudo[];
}

// Supprime du bucket `entry-photos` les fichiers correspondant à des URLs
// publiques données (extraites de entries.photo_url). Best-effort : un échec
// de nettoyage du stockage ne doit jamais empêcher la suppression des
// données elles-mêmes (clics, compteur), donc on journalise sans relancer.
async function removeEntryPhotos(photoUrls: (string | null)[]): Promise<void> {
  const paths = photoUrls
    .filter((url): url is string => !!url)
    .map((url) => url.split('/entry-photos/')[1])
    .filter((path): path is string => !!path);
  if (paths.length === 0) return;

  try {
    const { error } = await supabase.storage.from('entry-photos').remove(paths);
    if (error) throw error;
  } catch (error) {
    console.warn('[storage] échec de la suppression de photos orphelines', error);
  }
}

export async function resetCounterEntries(counterId: string): Promise<void> {
  const { data: entries, error: fetchError } = await supabase
    .from('entries')
    .select('photo_url')
    .eq('counter_id', counterId);
  if (fetchError) throw fetchError;
  await removeEntryPhotos((entries ?? []).map((e) => e.photo_url));

  const { error } = await supabase.from('entries').delete().eq('counter_id', counterId);
  if (error) throw error;
}

// Supprime le compteur (les clics associés partent en cascade côté base).
// Si ce compteur appartenait à un groupe, retire aussi son adhésion
// (group_members) : la supprimer sans quitter le groupe laisserait un
// membre "fantôme" visible dans les classements avec 0 clic.
export async function deleteCounter(counterId: string, userId: string): Promise<void> {
  const counter = await fetchCounterById(counterId);

  const { data: entries, error: fetchError } = await supabase
    .from('entries')
    .select('photo_url')
    .eq('counter_id', counterId);
  if (fetchError) throw fetchError;
  await removeEntryPhotos((entries ?? []).map((e) => e.photo_url));

  const { error } = await supabase.from('counters').delete().eq('id', counterId);
  if (error) throw error;

  if (counter.group_id) {
    const { error: leaveError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', counter.group_id)
      .eq('user_id', userId);
    if (leaveError) throw leaveError;
  }
}

export async function uploadEntryPhoto(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  // Sur le web, localUri est une URL blob: (pas d'extension de fichier) : on déduit
  // le type et l'extension du Blob lui-même plutôt que de l'URI, ce qui fonctionne
  // aussi bien pour les file:// natifs que pour les blob: du web.
  const contentType = blob.type || 'image/jpeg';
  const ext = contentType.split('/').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('entry-photos').upload(path, blob, {
    contentType,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('entry-photos').getPublicUrl(path);
  return data.publicUrl;
}
