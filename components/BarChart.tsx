import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors, spacing } from '../lib/theme';

export interface BarChartDatum {
  label: string;
  value: number;
}

interface Props {
  data: BarChartDatum[];
  height?: number;
}

// Graphique en barres minimaliste (react-native-svg), sans dépendance de charting lourde.
export function BarChart({ data, height = 160 }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 24;
  const gap = 12;
  const chartWidth = data.length * (barWidth + gap) + gap;

  return (
    <View style={styles.wrapper}>
      <Svg width={chartWidth} height={height}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 24);
          const x = gap + i * (barWidth + gap);
          const y = height - 24 - barHeight;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={6}
              fill={colors.olive}
            />
          );
        })}
      </Svg>
      <View style={[styles.labelsRow, { width: chartWidth }]}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.label, { width: barWidth + gap }]}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
