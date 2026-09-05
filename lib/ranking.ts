import { startOfDay, startOfMonth, startOfYear } from './dateRanges';
import { distinctLocationCount } from './geo';
import { RankingPeriod, RankingRow } from './types';

export interface RankingEntryInput {
  user_id: string;
  timestamp: string;
}

export interface MemberInput {
  user_id: string;
  pseudo: string;
}

function periodStart(period: RankingPeriod, now: Date): number {
  switch (period) {
    case 'day':
      return startOfDay(now).getTime();
    case 'month':
      return startOfMonth(now).getTime();
    case 'year':
      return startOfYear(now).getTime();
  }
}

// Classement "Meilleurs localisateurs" : nombre de clics par membre sur la période, décroissant.
export function bestLocatorsRanking(
  members: MemberInput[],
  entries: RankingEntryInput[],
  period: RankingPeriod,
  now: Date = new Date()
): RankingRow[] {
  const since = periodStart(period, now);
  const scoreByUser = new Map<string, number>();
  for (const member of members) scoreByUser.set(member.user_id, 0);

  for (const entry of entries) {
    if (new Date(entry.timestamp).getTime() < since) continue;
    scoreByUser.set(entry.user_id, (scoreByUser.get(entry.user_id) ?? 0) + 1);
  }

  return toSortedRows(members, scoreByUser);
}

export interface GlobetrotterEntryInput {
  user_id: string;
  lat: number | null;
  lng: number | null;
}

// Classement "Globe-trotteur" : nombre de lieux distincts (~11m) par membre, tout l'historique.
export function globetrotterRanking(
  members: MemberInput[],
  entries: GlobetrotterEntryInput[]
): RankingRow[] {
  const entriesByUser = new Map<string, GlobetrotterEntryInput[]>();
  for (const member of members) entriesByUser.set(member.user_id, []);

  for (const entry of entries) {
    if (entry.lat == null || entry.lng == null) continue;
    const list = entriesByUser.get(entry.user_id) ?? [];
    list.push(entry);
    entriesByUser.set(entry.user_id, list);
  }

  const scoreByUser = new Map<string, number>();
  for (const [userId, userEntries] of entriesByUser) {
    scoreByUser.set(userId, distinctLocationCount(userEntries));
  }

  return toSortedRows(members, scoreByUser);
}

function toSortedRows(members: MemberInput[], scoreByUser: Map<string, number>): RankingRow[] {
  const pseudoByUser = new Map(members.map((m) => [m.user_id, m.pseudo]));
  const rows: RankingRow[] = Array.from(scoreByUser.entries()).map(([user_id, score]) => ({
    user_id,
    pseudo: pseudoByUser.get(user_id) ?? '???',
    score,
  }));
  return rows.sort((a, b) => b.score - a.score || a.pseudo.localeCompare(b.pseudo));
}
