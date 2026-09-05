import { useAudioPlayer } from 'expo-audio';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing } from '../lib/theme';
import { SOUND_ASSETS, SOUND_LIBRARY } from '../lib/sounds';
import { SoundDef, SoundId } from '../lib/types';

interface RowProps {
  sound: SoundDef;
  selected: boolean;
  onSelect: () => void;
}

function SoundRow({ sound, selected, onSelect }: RowProps) {
  const player = useAudioPlayer(SOUND_ASSETS[sound.id]);

  function handlePreview() {
    player.seekTo(0);
    player.play();
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onSelect}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <Text style={styles.rowLabel}>{sound.label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Écouter ${sound.label}`}
        onPress={handlePreview}
        style={styles.previewButton}
      >
        <Text style={styles.previewLabel}>▶︎ Écouter</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

interface Props {
  value: SoundId;
  onChange: (id: SoundId) => void;
}

export function SoundPicker({ value, onChange }: Props) {
  return (
    <View>
      {SOUND_LIBRARY.map((sound) => (
        <SoundRow
          key={sound.id}
          sound={sound}
          selected={sound.id === value}
          onSelect={() => onChange(sound.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 16,
  },
  previewButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewLabel: {
    color: colors.accentLight,
    fontWeight: '600',
  },
});
