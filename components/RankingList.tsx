import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../lib/theme';
import { RankingRow } from '../lib/types';

const MEDALS = ['🥇', '🥈', '🥉'];

interface Props {
  rows: RankingRow[];
  emptyLabel?: string;
}

export function RankingList({ rows, emptyLabel = 'Aucun membre pour l’instant.' }: Props) {
  if (rows.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {rows.map((row, index) => (
        <View key={row.user_id} style={styles.row}>
          <Text style={styles.rank}>{MEDALS[index] ?? `${index + 1}.`}</Text>
          <Text style={styles.pseudo} numberOfLines={1}>
            {row.pseudo}
          </Text>
          <Text style={styles.score}>{row.score}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.textMuted,
  },
  rank: {
    width: 36,
    fontSize: 16,
    color: colors.accentLight,
  },
  pseudo: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  score: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
