import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Image de fond appliquée derrière toute l'app, avec un voile sombre assez
// fort pour garder le texte lisible par-dessus (l'illustration d'origine est
// très chargée en couleurs). Les écrans restent construits comme avant
// (cartes, boutons opaques) ; seuls les fonds "vides" laissent voir l'image.
export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <Image
        source={require('../assets/background.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.scrim} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(43, 27, 18, 0.85)',
  },
  content: {
    flex: 1,
  },
});
