import { clusterEntriesByLocation, distinctLocationCount, roundCoordinate } from '../geo';

describe('roundCoordinate', () => {
  it('rounds to 4 decimal places (~11m)', () => {
    expect(roundCoordinate(48.117347)).toBe(48.1173);
    expect(roundCoordinate(-1.677812)).toBe(-1.6778);
  });
});

describe('distinctLocationCount', () => {
  it('counts two very close points (within ~11m) as one location', () => {
    const count = distinctLocationCount([
      { lat: 48.11731, lng: -1.67781 },
      { lat: 48.11729, lng: -1.67779 },
    ]);
    expect(count).toBe(1);
  });

  it('counts distinct far-apart points separately', () => {
    const count = distinctLocationCount([
      { lat: 48.1173, lng: -1.6778 },
      { lat: 45.764, lng: 4.8357 }, // Lyon
    ]);
    expect(count).toBe(2);
  });

  it('ignores entries without coordinates', () => {
    expect(
      distinctLocationCount([
        { lat: null, lng: null },
        { lat: 48.1173, lng: -1.6778 },
      ])
    ).toBe(1);
  });
});

describe('clusterEntriesByLocation', () => {
  it('groups nearby entries and counts clicks per cluster', () => {
    const clusters = clusterEntriesByLocation([
      { lat: 48.1173, lng: -1.6778, timestamp: '2026-01-01T10:00:00', photo_url: null },
      { lat: 48.1173, lng: -1.6778, timestamp: '2026-01-02T10:00:00', photo_url: 'photo2.jpg' },
      { lat: 45.764, lng: 4.8357, timestamp: '2026-01-01T10:00:00', photo_url: null },
    ]);
    expect(clusters).toHaveLength(2);
    const rennesCluster = clusters.find((c) => c.lat === 48.1173);
    expect(rennesCluster?.count).toBe(2);
    expect(rennesCluster?.latestPhotoUrl).toBe('photo2.jpg');
  });

  it('excludes entries without coordinates', () => {
    const clusters = clusterEntriesByLocation([
      { lat: null, lng: null, timestamp: '2026-01-01T10:00:00', photo_url: null },
    ]);
    expect(clusters).toHaveLength(0);
  });
});
