import { csvFileName, entriesToCsv } from '../csv';

describe('entriesToCsv', () => {
  it('produces the header even with no rows', () => {
    expect(entriesToCsv([])).toBe('date,heure,compteur,latitude,longitude,photo');
  });

  it('formats a row per the cahier des charges example', () => {
    const csv = entriesToCsv([
      {
        timestamp: '2026-09-05T14:32:00',
        counterName: 'Teckels croisés',
        lat: 48.1173,
        lng: -1.6778,
        hasPhoto: true,
      },
    ]);
    expect(csv).toBe(
      'date,heure,compteur,latitude,longitude,photo\n' +
        '2026-09-05,14:32,Teckels croisés,48.1173,-1.6778,oui'
    );
  });

  it('leaves lat/lng empty and photo=non when absent', () => {
    const csv = entriesToCsv([
      {
        timestamp: '2026-01-01T09:05:00',
        counterName: 'Solo',
        lat: null,
        lng: null,
        hasPhoto: false,
      },
    ]);
    expect(csv).toContain('2026-01-01,09:05,Solo,,,non');
  });

  it('escapes commas and quotes in the counter name', () => {
    const csv = entriesToCsv([
      {
        timestamp: '2026-01-01T00:00:00',
        counterName: 'Chiens, "gentils"',
        lat: null,
        lng: null,
        hasPhoto: false,
      },
    ]);
    expect(csv).toContain('"Chiens, ""gentils"""');
  });
});

describe('csvFileName', () => {
  it('slugifies accented counter names', () => {
    expect(csvFileName('Teckels croisés')).toMatch(/^teckels-croises-\d{8}\.csv$/);
  });

  it('falls back to "compteur" when the name has no usable characters', () => {
    expect(csvFileName('!!!')).toMatch(/^compteur-\d{8}\.csv$/);
  });
});
