import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { csvFileName, CsvEntryRow, entriesToCsv } from './csv';

// Génère le CSV à la volée (non stocké en permanence) et ouvre la fenêtre de partage native.
export async function exportEntriesAsCsv(counterName: string, rows: CsvEntryRow[]): Promise<void> {
  const content = entriesToCsv(rows);
  const file = new File(Paths.cache, csvFileName(counterName));
  file.write(content);

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: `Exporter ${counterName}`,
    });
  }
}
