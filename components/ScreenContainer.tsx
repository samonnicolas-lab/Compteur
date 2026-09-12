import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '../lib/theme';

export function ScreenContainer({ style, children, ...rest }: ViewProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Sur grand écran (web desktop), recentre le contenu plutôt que de
          l'étirer sur toute la largeur : mise en page pensée pour mobile. */}
      <View style={styles.center}>
        <View style={[styles.container, style]} {...rest}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    // Transparent pour laisser voir l'image de fond posée par AppBackground
    // (App.tsx), derrière laquelle ce voile sombre reste appliqué.
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    padding: spacing.md,
  },
});
