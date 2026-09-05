import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { capsuleRadius, colors, spacing } from '../lib/theme';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    ...capsuleRadius,
  },
});
