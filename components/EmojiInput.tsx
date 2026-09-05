import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '../lib/theme';

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

// Ouvre le clavier emoji natif du système, pas besoin de librairie tierce.
// Le texte est transmis tel quel : de nombreux emojis (teint, drapeaux, familles...)
// sont composés de plusieurs caractères techniques, et essayer de n'en garder
// qu'un seul "dernier caractère" les tronque et les casse.
export function EmojiInput({ value, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.input}
        maxLength={16}
        placeholder="🐾"
        placeholderTextColor={colors.textMuted}
        textAlign="center"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  input: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.card,
    fontSize: 48,
    color: colors.text,
  },
});
