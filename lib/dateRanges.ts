// Bornes de périodes calendaires, calculées dans le fuseau horaire local de l'appareil.

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  // Semaine calendaire commençant le lundi.
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = dimanche ... 6 = samedi
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export function startOfYear(date: Date): Date {
  const d = startOfDay(date);
  d.setMonth(0, 1);
  return d;
}

export interface PeriodCounts {
  today: number;
  week: number;
  month: number;
  year: number;
}

export function countEntriesByPeriod(
  timestamps: (string | Date)[],
  now: Date = new Date()
): PeriodCounts {
  const dayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now).getTime();
  const monthStart = startOfMonth(now).getTime();
  const yearStart = startOfYear(now).getTime();

  const counts: PeriodCounts = { today: 0, week: 0, month: 0, year: 0 };

  for (const ts of timestamps) {
    const t = (ts instanceof Date ? ts : new Date(ts)).getTime();
    if (t >= yearStart) counts.year++;
    if (t >= monthStart) counts.month++;
    if (t >= weekStart) counts.week++;
    if (t >= dayStart) counts.today++;
  }

  return counts;
}

// Nombre de clics par jour sur les `days` derniers jours (dont aujourd'hui), ordre chronologique.
export function last7DaysBuckets(
  timestamps: (string | Date)[],
  now: Date = new Date(),
  days = 7
): { date: Date; count: number }[] {
  const buckets: { date: Date; count: number }[] = [];
  const today = startOfDay(now);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({ date: d, count: 0 });
  }

  const bucketStart = buckets[0].date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const ts of timestamps) {
    const t = (ts instanceof Date ? ts : new Date(ts)).getTime();
    if (t < bucketStart) continue;
    const index = Math.floor((t - bucketStart) / dayMs);
    if (index >= 0 && index < buckets.length) {
      buckets[index].count++;
    }
  }

  return buckets;
}
