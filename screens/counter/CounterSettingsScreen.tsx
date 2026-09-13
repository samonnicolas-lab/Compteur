import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SoundPicker } from '../../components/SoundPicker';
import { TextField } from '../../components/TextField';
import { alert } from '../../lib/alert';
import { fetchCounterById, updateCounterSettings } from '../../lib/api';
import { colors, spacing } from '../../lib/theme';
import { Counter, SoundId } from '../../lib/types';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CounterSettings'>;

export function CounterSettingsScreen({ route, navigation }: Props) {
  const { counterId } = route.params;
  const [counter, setCounter] = useState<Counter | null>(null);
  const [name, setName] = useState('');
  const [soundId, setSoundId] = useState<SoundId>('clic');
  const [geolocEnabled, setGeolocEnabled] = useState(false);
  const [photoEnabled, setPhotoEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await fetchCounterById(counterId);
      setCounter(c);
      setName(c.name);
      setSoundId(c.sound_id);
      setGeolocEnabled(c.geoloc_enabled);
      setPhotoEnabled(c.photo_enabled);
    } catch (error) {
      alert('Erreur', (error as Error).message);
    }
  }, [counterId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSave() {
    if (!name.trim()) {
      alert('Nom manquant', 'Merci de renseigner un nom pour le compteur.');
      return;
    }
    setSaving(true);
    try {
      await updateCounterSettings(counterId, { name: name.trim(), soundId, geolocEnabled, photoEnabled });
      navigation.goBack();
    } catch (error) {
      alert('Erreur', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!counter) {
    return <ScreenContainer />;
  }

  return (
    <ScreenContainer>
      <ScrollView>
        <Text style={styles.title}>Réglages du compteur</Text>

        <TextField label="Nom du compteur" value={name} onChangeText={setName} />

        <Text style={styles.sectionTitle}>Son du bouton</Text>
        <SoundPicker value={soundId} onChange={setSoundId} />

        <Card style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Géolocalisation</Text>
            <Text style={styles.optionSubtitle}>
              Capturer automatiquement la position à chaque clic
            </Text>
          </View>
          <Switch
            value={geolocEnabled}
            onValueChange={setGeolocEnabled}
            trackColor={{ true: colors.accent, false: colors.textMuted }}
          />
        </Card>

        <Card style={styles.optionRow}>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Photo</Text>
            <Text style={styles.optionSubtitle}>
              Proposer une photo (prise ou choisie) à chaque clic
            </Text>
          </View>
          <Switch
            value={photoEnabled}
            onValueChange={setPhotoEnabled}
            trackColor={{ true: colors.accent, false: colors.textMuted }}
          />
        </Card>

        <Button label="Enregistrer" onPress={handleSave} loading={saving} style={styles.saveButton} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  optionText: {
    flex: 1,
    marginRight: spacing.md,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
