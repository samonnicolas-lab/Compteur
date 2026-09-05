import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchCounterById,
  fetchEntriesForCounter,
  insertEntry,
  updateEntryLocation,
  uploadEntryPhoto,
} from '../../lib/api';
import { SOUND_ASSETS } from '../../lib/sounds';
import { Counter } from '../../lib/types';
import { CounterTabParamList } from '../../navigation/types';
import { PhotoStepModal } from './PhotoStepModal';

type Props = BottomTabScreenProps<CounterTabParamList, 'Compteur'>;

export function CounterScreen({ route }: Props) {
  const { counterId } = route.params;
  const { session } = useAuth();
  const [counter, setCounter] = useState<Counter | null>(null);
  const [total, setTotal] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const player = useAudioPlayer(counter ? SOUND_ASSETS[counter.sound_id] : undefined);

  const load = useCallback(async () => {
    const [c, entries] = await Promise.all([
      fetchCounterById(counterId),
      fetchEntriesForCounter(counterId),
    ]);
    setCounter(c);
    setTotal(entries.length);
  }, [counterId]);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => Alert.alert('Erreur', (error as Error).message));
    }, [load])
  );

  function playClickSound() {
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // La lecture du son ne doit jamais empêcher l'enregistrement du clic.
    }
  }

  // Capture la position en arrière-plan sans bloquer l'enregistrement du clic.
  async function captureLocationInBackground(entryId: string) {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await updateEntryLocation(
        entryId,
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy ?? null
      );
    } catch {
      // Position indisponible : le clic reste enregistré sans coordonnées.
    }
  }

  async function saveEntry(photoUri: string | null) {
    if (!session || !counter) return;
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        try {
          photoUrl = await uploadEntryPhoto(session.user.id, photoUri);
        } catch (error) {
          Alert.alert('Photo non envoyée', (error as Error).message);
        }
      }

      const entry = await insertEntry({
        counterId: counter.id,
        userId: session.user.id,
        lat: null,
        lng: null,
        accuracy: null,
        photoUrl,
      });

      setTotal((t) => t + 1);

      if (counter.geoloc_enabled) {
        captureLocationInBackground(entry.id);
      }
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handlePress() {
    if (!counter || saving) return;
    playClickSound();

    if (counter.photo_enabled) {
      setShowPhotoModal(true);
    } else {
      saveEntry(null);
    }
  }

  if (!counter) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{counter.name}</Text>
      <Text style={styles.total}>{total}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Enregistrer un clic pour ${counter.name}`}
        onPress={handlePress}
        disabled={saving}
        style={styles.bigButton}
      >
        <Text style={styles.bigEmoji}>{counter.emoji}</Text>
      </TouchableOpacity>

      <PhotoStepModal
        visible={showPhotoModal}
        onPhoto={(uri) => {
          setShowPhotoModal(false);
          saveEntry(uri);
        }}
        onSkip={() => {
          setShowPhotoModal(false);
          saveEntry(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  total: {
    color: colors.accentLight,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  bigButton: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.accent,
  },
  bigEmoji: {
    fontSize: 120,
  },
});
