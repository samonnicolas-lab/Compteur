// Arrondit une coordonnée à ~11m de précision (4 décimales ≈ 11.1m en latitude).
const PRECISION_DECIMALS = 4;

export function roundCoordinate(value: number): number {
  const factor = 10 ** PRECISION_DECIMALS;
  return Math.round(value * factor) / factor;
}

export function locationKey(lat: number, lng: number): string {
  return `${roundCoordinate(lat)},${roundCoordinate(lng)}`;
}

export interface GeoEntry {
  lat: number | null;
  lng: number | null;
}

// Nombre de lieux distincts (arrondis à ~11m) parmi des entrées géolocalisées.
export function distinctLocationCount(entries: GeoEntry[]): number {
  const keys = new Set<string>();
  for (const entry of entries) {
    if (entry.lat == null || entry.lng == null) continue;
    keys.add(locationKey(entry.lat, entry.lng));
  }
  return keys.size;
}

export interface MapCluster {
  key: string;
  lat: number;
  lng: number;
  count: number;
  latestPhotoUrl: string | null;
}

export interface MapEntry {
  lat: number | null;
  lng: number | null;
  timestamp: string;
  photo_url: string | null;
}

// Regroupe les entrées géolocalisées par lieu arrondi, pour l'affichage sur la carte.
export function clusterEntriesByLocation(entries: MapEntry[]): MapCluster[] {
  const clusters = new Map<string, MapCluster & { latestTimestamp: number }>();

  for (const entry of entries) {
    if (entry.lat == null || entry.lng == null) continue;
    const lat = roundCoordinate(entry.lat);
    const lng = roundCoordinate(entry.lng);
    const key = `${lat},${lng}`;
    const ts = new Date(entry.timestamp).getTime();

    const existing = clusters.get(key);
    if (!existing) {
      clusters.set(key, {
        key,
        lat,
        lng,
        count: 1,
        latestPhotoUrl: entry.photo_url,
        latestTimestamp: ts,
      });
    } else {
      existing.count += 1;
      if (ts >= existing.latestTimestamp) {
        existing.latestTimestamp = ts;
        existing.latestPhotoUrl = entry.photo_url;
      }
    }
  }

  return Array.from(clusters.values()).map(({ latestTimestamp: _t, ...rest }) => rest);
}
