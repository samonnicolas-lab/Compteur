export interface CsvEntryRow {
  timestamp: string;
  counterName: string;
  lat: number | null;
  lng: number | null;
  hasPhoto: boolean;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// Formate une ligne CSV : date,heure,compteur,latitude,longitude,photo
export function entriesToCsv(rows: CsvEntryRow[]): string {
  const header = 'date,heure,compteur,latitude,longitude,photo';
  const lines = rows.map((row) => {
    const d = new Date(row.timestamp);
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const heure = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const lat = row.lat != null ? row.lat.toString() : '';
    const lng = row.lng != null ? row.lng.toString() : '';
    const photo = row.hasPhoto ? 'oui' : 'non';
    return [date, heure, csvEscape(row.counterName), lat, lng, photo].join(',');
  });
  return [header, ...lines].join('\n');
}

// Diacritiques Unicode (U+0300–U+036F) laissées par la normalisation NFD.
const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function csvFileName(counterName: string): string {
  const slug = counterName
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  const now = new Date();
  const stamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now
    .getDate()
    .toString()
    .padStart(2, '0')}`;
  return `${slug || 'compteur'}-${stamp}.csv`;
}
