import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alert } from '../../lib/alert';
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
import { CounterTabParamList, RootStackParamList } from '../../navigation/types';
import { PhotoStepModal } from './PhotoStepModal';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CounterTabParamList, 'Compteur'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function CounterScreen({ route, navigation }: Props) {
  const { counterId } = route.params;
  const { session } = useAuth();
  const [counter, setCounter] = useState<Counter | null>(null);
  const [total, setTotal] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

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
      load().catch((error) => alert('Erreur', (error as Error).message));
    }, [load])
  );

  async function playClickSound() {
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      // La lecture du son ne doit jamais empêcher l'enregistrement du clic.
    }
  }

  // Capture la position en arrière-plan sans bloquer l'enregistrement du clic.
  // L'échec ne doit jamais empêcher le clic d'être compté (déjà enregistré
  // avant l'appel), mais doit rester visible : sans ça, un refus
  // d'autorisation ou un GPS indisponible passait totalement inaperçu — le
  // clic semblait réussir alors que la position n'était jamais capturée.
  async function captureLocationInBackground(entryId: string) {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        alert(
          'Position non enregistrée',
          'Ce clic a bien été compté, mais la localisation n’a pas pu être ajoutée : l’autorisation de localisation a été refusée. Activez-la pour ce site dans les réglages de votre téléphone si vous voulez que vos prochains clics apparaissent sur la carte.'
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await updateEntryLocation(
        entryId,
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy ?? null
      );
    } catch (error) {
      // Position indisponible (GPS, timeout...) : le clic reste enregistré sans coordonnées.
      alert(
        'Position non enregistrée',
        `Ce clic a bien été compté, mais la localisation n’a pas pu être capturée (${(error as Error).message}).`
      );
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
          alert('Photo non envoyée', (error as Error).message);
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
      alert('Erreur', (error as Error).message);
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
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Réglages du compteur"
        onPress={() => navigation.navigate('CounterSettings', { counterId })}
        style={[styles.settingsButton, { top: insets.top + spacing.sm }]}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Retour à Mes Compteurs"
        onPress={() => navigation.navigate('Home')}
        style={[styles.backButton, { top: insets.top + spacing.sm }]}
      >
        <Text style={styles.backButtonText}>← Mes Compteurs</Text>
      </TouchableOpacity>

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
    // Transparent pour laisser voir l'image de fond posée par AppBackground.
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  settingsButton: {
    // "top" est complété dynamiquement avec l'inset de zone sûre (encoche /
    // barre de statut) : l'en-tête natif étant masqué sur cet onglet, rien
    // d'autre ne réserve cet espace.
    position: 'absolute',
    left: spacing.lg,
    zIndex: 1,
    padding: spacing.xs,
  },
  settingsIcon: {
    fontSize: 26,
  },
  backButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
    padding: spacing.xs,
  },
  backButtonText: {
    color: colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
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
