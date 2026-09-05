import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing } from '../lib/theme';
import { CounterWithTotal } from '../lib/types';
import { Card } from './Card';

interface Props {
  counter: CounterWithTotal;
  onPress: () => void;
}

export function CounterCard({ counter, onPress }: Props) {
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress}>
      <Card style={styles.card}>
        <Text style={styles.emoji}>{counter.emoji || '🔘'}</Text>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {counter.name}
          </Text>
          <Text style={styles.total}>{counter.total_entries} clic{counter.total_entries > 1 ? 's' : ''}</Text>
        </View>
        {counter.group_id ? <Text style={styles.badge}>Groupe</Text> : null}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  total: {
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    color: colors.olive,
    fontSize: 12,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.olive,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
