import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '../lib/theme';

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

// Champ limité à un caractère : ouvre le clavier emoji natif du système,
// pas besoin de librairie de sélection d'emoji tierce.
export function EmojiInput({ value, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={(text) => {
          const chars = Array.from(text);
          onChange(chars.length ? chars[chars.length - 1] : '');
        }}
        style={styles.input}
        maxLength={4}
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
