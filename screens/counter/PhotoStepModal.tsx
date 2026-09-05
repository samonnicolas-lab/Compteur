import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { colors, spacing } from '../../lib/theme';

interface Props {
  visible: boolean;
  onPhoto: (uri: string) => void;
  onSkip: () => void;
}

export function PhotoStepModal({ visible, onPhoto, onSkip }: Props) {
  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      onSkip();
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets?.[0]) {
      onPhoto(result.assets[0].uri);
    } else {
      onSkip();
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      onSkip();
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets?.[0]) {
      onPhoto(result.assets[0].uri);
    } else {
      onSkip();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Ajouter une photo ?</Text>
          <Button label="Prendre une photo" onPress={takePhoto} style={styles.button} />
          <Button
            label="Choisir dans la galerie"
            variant="secondary"
            onPress={pickFromLibrary}
            style={styles.button}
          />
          <Button label="Passer" variant="ghost" onPress={onSkip} style={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
  },
});
