import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmojiInput } from '../../components/EmojiInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SoundPicker } from '../../components/SoundPicker';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { createCounter, createGroup } from '../../lib/api';
import { colors, spacing } from '../../lib/theme';
import { SoundId } from '../../lib/types';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCounter'>;

type ShareMode = 'solo' | 'create-group';

const STEPS = ['Nom', 'Icône', 'Son', 'Options', 'Partage'] as const;

export function CreateCounterWizard({ navigation }: Props) {
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🐾');
  const [soundId, setSoundId] = useState<SoundId>('clic');
  const [geolocEnabled, setGeolocEnabled] = useState(false);
  const [photoEnabled, setPhotoEnabled] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>('solo');
  const [newGroupName, setNewGroupName] = useState('');

  function canGoNext(): boolean {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return emoji.trim().length > 0;
    if (step === 4) {
      if (shareMode === 'create-group') return newGroupName.trim().length > 0;
    }
    return true;
  }

  async function handleFinish() {
    if (!session) return;
    setSubmitting(true);
    try {
      let groupId: string | null = null;
      if (shareMode === 'create-group') {
        const group = await createGroup(session.user.id, newGroupName.trim());
        groupId = group.id;
      }

      await createCounter({
        ownerId: session.user.id,
        name: name.trim(),
        emoji: emoji.trim(),
        soundId,
        geolocEnabled,
        photoEnabled,
        groupId,
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('Impossible de créer le compteur', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.stepIndicator}>
        Étape {step + 1}/{STEPS.length} — {STEPS[step]}
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <TextField
            label="Nom du compteur"
            value={name}
            onChangeText={setName}
            placeholder="ex. Teckels croisés dans la rue"
            autoFocus
          />
        )}

        {step === 1 && (
          <View style={styles.centered}>
            <Text style={styles.helpText}>
              Choisissez un emoji comme icône (le clavier emoji de votre téléphone s’ouvre
              automatiquement).
            </Text>
            <EmojiInput value={emoji} onChange={setEmoji} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.helpText}>
              Ce son sera joué à chaque clic sur le compteur. Écoutez avant de valider.
            </Text>
            <SoundPicker value={soundId} onChange={setSoundId} />
          </View>
        )}

        {step === 3 && (
          <View>
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
          </View>
        )}

        {step === 4 && (
          <View>
            <ShareOption
              label="Garder en solo"
              description="Vous seul utilisez ce compteur."
              selected={shareMode === 'solo'}
              onPress={() => setShareMode('solo')}
            />
            <ShareOption
              label="Créer un groupe"
              description="Créez un groupe autour de ce compteur, partagez le code d’invitation."
              selected={shareMode === 'create-group'}
              onPress={() => setShareMode('create-group')}
            />
            {shareMode === 'create-group' && (
              <TextField
                label="Nom du groupe"
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="ex. Chasseurs de teckels"
              />
            )}
            <Text style={styles.helpText}>
              Pour rejoindre un groupe existant avec un code d’invitation, utilisez plutôt
              « Rejoindre un compteur » depuis l’accueil.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Button label="Précédent" variant="secondary" onPress={() => setStep(step - 1)} />
        )}
        {step < STEPS.length - 1 ? (
          <Button
            label="Suivant"
            onPress={() => setStep(step + 1)}
            disabled={!canGoNext()}
            style={styles.grow}
          />
        ) : (
          <Button
            label="Créer le compteur"
            onPress={handleFinish}
            disabled={!canGoNext()}
            loading={submitting}
            style={styles.grow}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

function ShareOption({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Card
      style={StyleSheet.flatten([styles.shareOption, selected && styles.shareOptionSelected])}
    >
      <Text style={styles.optionTitle} onPress={onPress}>
        {selected ? '● ' : '○ '}
        {label}
      </Text>
      <Text style={styles.optionSubtitle}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    color: colors.accentLight,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  centered: {
    alignItems: 'center',
  },
  helpText: {
    color: colors.textMuted,
    marginBottom: spacing.md,
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
  shareOption: {
    marginBottom: spacing.sm,
  },
  shareOptionSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  grow: {
    flex: 1,
  },
});
