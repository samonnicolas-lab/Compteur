export type SoundId = 'cloche' | 'clic' | 'bip' | 'applaudissement' | 'tambour' | 'aboiement';

export interface SoundDef {
  id: SoundId;
  label: string;
  fileAsset: string;
}

export interface Profile {
  id: string;
  pseudo: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Counter {
  id: string;
  owner_id: string;
  name: string;
  emoji: string;
  sound_id: SoundId;
  geoloc_enabled: boolean;
  photo_enabled: boolean;
  group_id: string | null;
  created_at: string;
}

export interface CounterWithTotal extends Counter {
  total_entries: number;
  // Nombre de membres du groupe partagé, uniquement si group_id est renseigné.
  group_member_count: number | null;
}

export interface Entry {
  id: string;
  counter_id: string;
  user_id: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  photo_url: string | null;
}

export type RankingPeriod = 'day' | 'month' | 'year';

export interface RankingRow {
  user_id: string;
  pseudo: string;
  score: number;
}
