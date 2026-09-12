import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../lib/theme';

// Image de fond appliquée derrière toute l'app, avec un voile sombre assez
// fort pour garder le texte lisible par-dessus (l'illustration d'origine est
// très chargée en couleurs). Les écrans restent construits comme avant
// (cartes, boutons opaques) ; seuls les fonds "vides" laissent voir l'image.
//
// Le cadre (image + voile + contenu) est plafonné à la même largeur que le
// contenu de l'app (voir ScreenContainer) et centré : sur grand écran (web
// desktop), l'image ne s'étire pas sur toute la fenêtre, elle reste confinée
// derrière l'app, avec un fond uni de part et d'autre.
export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.frame}>
        <Image
          source={require('../assets/background.jpg')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.scrim} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(43, 27, 18, 0.6)',
  },
  content: {
    flex: 1,
  },
});
