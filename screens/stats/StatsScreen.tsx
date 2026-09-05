import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarChart } from '../../components/BarChart';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { fetchCounterById, fetchEntriesForCounter } from '../../lib/api';
import { countEntriesByPeriod, last7DaysBuckets, PeriodCounts } from '../../lib/dateRanges';
import { exportEntriesAsCsv } from '../../lib/exportCsv';
import { colors, spacing } from '../../lib/theme';
import { Counter, Entry } from '../../lib/types';
import { CounterTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<CounterTabParamList, 'Statistiques'>;

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function StatsScreen({ route }: Props) {
  const { counterId } = route.params;
  const [counter, setCounter] = useState<Counter | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([
        fetchCounterById(counterId),
        fetchEntriesForCounter(counterId),
      ]);
      setCounter(c);
      setEntries(e);
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [counterId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleExport() {
    if (!counter) return;
    setExporting(true);
    try {
      await exportEntriesAsCsv(
        counter.name,
        entries.map((e) => ({
          timestamp: e.timestamp,
          counterName: counter.name,
          lat: e.lat,
          lng: e.lng,
          hasPhoto: !!e.photo_url,
        }))
      );
    } catch (error) {
      Alert.alert('Export impossible', (error as Error).message);
    } finally {
      setExporting(false);
    }
  }

  if (loading || !counter) {
    return <ScreenContainer />;
  }

  const timestamps = entries.map((e) => e.timestamp);
  const counts: PeriodCounts = countEntriesByPeriod(timestamps);
  const buckets = last7DaysBuckets(timestamps);
  const chartData = buckets.map((b) => ({
    label: WEEKDAY_LABELS[b.date.getDay()],
    value: b.count,
  }));

  return (
    <ScreenContainer>
      <ScrollView>
        <Text style={styles.title}>Statistiques — {counter.name}</Text>

        <View style={styles.statsGrid}>
          <StatTile label="Aujourd’hui" value={counts.today} />
          <StatTile label="Cette semaine" value={counts.week} />
          <StatTile label="Ce mois-ci" value={counts.month} />
          <StatTile label="Cette année" value={counts.year} />
        </View>

        <Text style={styles.sectionTitle}>7 derniers jours</Text>
        <Card>
          <BarChart data={chartData} />
        </Card>

        <Button
          label="Exporter en CSV"
          onPress={handleExport}
          loading={exporting}
          style={styles.exportButton}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tile: {
    width: '47%',
    alignItems: 'center',
  },
  tileValue: {
    color: colors.accentLight,
    fontSize: 28,
    fontWeight: '700',
  },
  tileLabel: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  exportButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
