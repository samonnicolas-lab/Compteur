import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmojiInput } from '../../components/EmojiInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SoundPicker } from '../../components/SoundPicker';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { alert } from '../../lib/alert';
import { createCounter, fetchGroupByInviteCode, fetchGroupCounterTemplate, joinGroupByInviteCode } from '../../lib/api';
import { normalizeInviteCode } from '../../lib/inviteCode';
import { supabase } from '../../lib/supabase';
import { colors, spacing } from '../../lib/theme';
import { SoundId } from '../../lib/types';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinCounter'>;

interface FoundGroup {
  id: string;
  name: string;
}

export function JoinCounterScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<FoundGroup | null>(null);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🐾');
  const [soundId, setSoundId] = useState<SoundId>('clic');
  const [geolocEnabled, setGeolocEnabled] = useState(false);
  const [photoEnabled, setPhotoEnabled] = useState(false);

  async function handleSearch() {
    const code = normalizeInviteCode(inviteCode);
    if (!code) return;
    setSearching(true);
    try {
      const foundGroup = await fetchGroupByInviteCode(code);
      const template = await fetchGroupCounterTemplate(foundGroup.id);
      setGroup(foundGroup);
      if (template) {
        setName(template.name);
        setEmoji(template.emoji);
        setSoundId(template.sound_id as SoundId);
        setGeolocEnabled(template.geoloc_enabled);
        setPhotoEnabled(template.photo_enabled);
      }
    } catch {
      alert('Groupe introuvable', 'Vérifiez le code d’invitation et réessayez.');
    } finally {
      setSearching(false);
    }
  }

  async function handleJoin() {
    if (!session || !group || !name.trim() || !emoji.trim()) return;
    setJoining(true);
    try {
      const {
        data: { session: freshSession },
      } = await supabase.auth.getSession();
      const userId = freshSession?.user.id ?? session.user.id;
      console.log(
        '[join] session (contexte) =',
        session.user.id,
        '| session (fraîche) =',
        freshSession?.user.id,
        '| code =',
        normalizeInviteCode(inviteCode),
        '| group.id =',
        group.id
      );

      await joinGroupByInviteCode(userId, normalizeInviteCode(inviteCode));
      const counter = await createCounter({
        ownerId: userId,
        name: name.trim(),
        emoji: emoji.trim(),
        soundId,
        geolocEnabled,
        photoEnabled,
        groupId: group.id,
      });
      navigation.replace('CounterTabs', { counterId: counter.id });
    } catch (error) {
      console.warn('[join] échec', error);
      alert('Impossible de rejoindre', (error as Error).message);
    } finally {
      setJoining(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.helpText}>
          Entrez le code d’invitation reçu d’un ami pour rejoindre son compteur partagé.
        </Text>

        <TextField
          label="Code d’invitation"
          value={inviteCode}
          onChangeText={(text) => {
            setInviteCode(text);
            setGroup(null);
          }}
          placeholder="ex. AB3FGH"
          autoCapitalize="characters"
          editable={!group}
        />

        {!group && (
          <Button
            label="Rechercher le groupe"
            onPress={handleSearch}
            loading={searching}
            disabled={normalizeInviteCode(inviteCode).length === 0}
          />
        )}

        {group && (
          <>
            <Card style={styles.groupCard}>
              <Text style={styles.groupLabel}>Groupe trouvé</Text>
              <Text style={styles.groupName}>{group.name}</Text>
            </Card>

            <Text style={styles.helpText}>
              Voici le compteur du groupe. Ajustez le nom, l’icône ou le son si vous le
              souhaitez — chaque membre a son propre exemplaire, mais les statistiques restent
              communes.
            </Text>

            <TextField label="Nom du compteur" value={name} onChangeText={setName} />

            <View style={styles.centered}>
              <EmojiInput value={emoji} onChange={setEmoji} />
            </View>

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

            <Button
              label="Rejoindre le groupe"
              onPress={handleJoin}
              loading={joining}
              disabled={!name.trim() || !emoji.trim()}
              style={styles.joinButton}
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  helpText: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  groupCard: {
    marginBottom: spacing.md,
  },
  groupLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.05,
  },
  groupName: {
    color: colors.accentLight,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  centered: {
    alignItems: 'center',
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
  joinButton: {
    marginTop: spacing.md,
  },
});
