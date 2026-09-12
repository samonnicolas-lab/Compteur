import { csvFileName, CsvEntryRow, entriesToCsv } from './csv';

// Sur le web, ni expo-file-system ni expo-sharing ne sont disponibles : on
// déclenche un téléchargement classique via un lien <a download> temporaire.
export async function exportEntriesAsCsv(counterName: string, rows: CsvEntryRow[]): Promise<void> {
  const content = entriesToCsv(rows);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = csvFileName(counterName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
