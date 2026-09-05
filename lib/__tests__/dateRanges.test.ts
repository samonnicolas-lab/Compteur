import { countEntriesByPeriod, last7DaysBuckets, startOfWeek } from '../dateRanges';

describe('startOfWeek', () => {
  it('returns the Monday of the current week', () => {
    // Wednesday 2026-09-02 -> Monday 2026-08-31
    const wednesday = new Date(2026, 8, 2, 15, 30);
    const monday = startOfWeek(wednesday);
    expect(monday.getDay()).toBe(1);
    expect(monday.toDateString()).toBe(new Date(2026, 7, 31).toDateString());
  });

  it('handles Sunday correctly (belongs to the previous Monday)', () => {
    const sunday = new Date(2026, 8, 6, 10, 0); // dimanche 6 sept 2026
    const monday = startOfWeek(sunday);
    expect(monday.toDateString()).toBe(new Date(2026, 7, 31).toDateString());
    expect(monday.getDay()).toBe(1);
  });
});

describe('countEntriesByPeriod', () => {
  const now = new Date(2026, 8, 5, 12, 0); // samedi 5 sept 2026, 12:00

  it('buckets an entry from today into today/week/month/year', () => {
    const counts = countEntriesByPeriod([new Date(2026, 8, 5, 8, 0)], now);
    expect(counts).toEqual({ today: 1, week: 1, month: 1, year: 1 });
  });

  it('excludes an entry from yesterday from "today" but keeps week/month/year', () => {
    const counts = countEntriesByPeriod([new Date(2026, 8, 4, 23, 0)], now);
    expect(counts).toEqual({ today: 0, week: 1, month: 1, year: 1 });
  });

  it('excludes an entry from last month from week/month but keeps year', () => {
    const counts = countEntriesByPeriod([new Date(2026, 7, 15, 10, 0)], now);
    expect(counts).toEqual({ today: 0, week: 0, month: 0, year: 1 });
  });

  it('excludes an entry from last year entirely', () => {
    const counts = countEntriesByPeriod([new Date(2025, 8, 5, 12, 0)], now);
    expect(counts).toEqual({ today: 0, week: 0, month: 0, year: 0 });
  });
});

describe('last7DaysBuckets', () => {
  it('produces 7 buckets ending today, in chronological order', () => {
    const now = new Date(2026, 8, 5, 12, 0);
    const buckets = last7DaysBuckets([], now);
    expect(buckets).toHaveLength(7);
    expect(buckets[6].date.toDateString()).toBe(now.toDateString());
    expect(buckets[0].date.toDateString()).toBe(new Date(2026, 7, 30).toDateString());
  });

  it('counts each timestamp in the right day bucket', () => {
    const now = new Date(2026, 8, 5, 12, 0);
    const buckets = last7DaysBuckets(
      [new Date(2026, 8, 5, 9, 0), new Date(2026, 8, 5, 20, 0), new Date(2026, 8, 3, 6, 0)],
      now
    );
    expect(buckets[6].count).toBe(2); // aujourd'hui
    expect(buckets[4].count).toBe(1); // il y a 2 jours
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(3);
  });
});
