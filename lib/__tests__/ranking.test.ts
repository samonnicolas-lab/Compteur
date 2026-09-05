import { bestLocatorsRanking, globetrotterRanking } from '../ranking';

const members = [
  { user_id: 'u1', pseudo: 'Alice' },
  { user_id: 'u2', pseudo: 'Bob' },
];

describe('bestLocatorsRanking', () => {
  const now = new Date(2026, 8, 5, 12, 0); // samedi 5 sept 2026

  it('ranks members by click count within the period, descending', () => {
    const entries = [
      { user_id: 'u1', timestamp: '2026-09-05T08:00:00' },
      { user_id: 'u1', timestamp: '2026-09-05T09:00:00' },
      { user_id: 'u2', timestamp: '2026-09-05T10:00:00' },
    ];
    const ranking = bestLocatorsRanking(members, entries, 'day', now);
    expect(ranking).toEqual([
      { user_id: 'u1', pseudo: 'Alice', score: 2 },
      { user_id: 'u2', pseudo: 'Bob', score: 1 },
    ]);
  });

  it('includes members with zero clicks in the period', () => {
    const ranking = bestLocatorsRanking(members, [], 'day', now);
    expect(ranking.map((r) => r.score)).toEqual([0, 0]);
  });

  it('excludes clicks outside the selected period', () => {
    const entries = [
      { user_id: 'u1', timestamp: '2026-08-01T08:00:00' }, // hors du mois/jour en cours
    ];
    expect(bestLocatorsRanking(members, entries, 'day', now)[0].score).toBe(0);
    expect(bestLocatorsRanking(members, entries, 'month', now)[0].score).toBe(0);
    expect(bestLocatorsRanking(members, entries, 'year', now)[0].score).toBe(1);
  });
});

describe('globetrotterRanking', () => {
  it('counts distinct rounded locations per member, all-time', () => {
    const entries = [
      { user_id: 'u1', lat: 48.1173, lng: -1.6778 },
      { user_id: 'u1', lat: 48.1173, lng: -1.6778 }, // même lieu, ne compte qu'une fois
      { user_id: 'u1', lat: 45.764, lng: 4.8357 },
      { user_id: 'u2', lat: 48.1173, lng: -1.6778 },
    ];
    const ranking = globetrotterRanking(members, entries);
    expect(ranking).toEqual([
      { user_id: 'u1', pseudo: 'Alice', score: 2 },
      { user_id: 'u2', pseudo: 'Bob', score: 1 },
    ]);
  });

  it('ignores entries without coordinates', () => {
    const ranking = globetrotterRanking(members, [{ user_id: 'u1', lat: null, lng: null }]);
    expect(ranking.every((r) => r.score === 0)).toBe(true);
  });
});
