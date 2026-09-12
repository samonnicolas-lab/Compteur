import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { RankingList } from '../../components/RankingList';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { alert } from '../../lib/alert';
import {
  createGroup,
  fetchCounterById,
  fetchEntriesForGroup,
  fetchGroupById,
  fetchGroupMembers,
  updateCounterGroupId,
} from '../../lib/api';
import { buildInviteMessage } from '../../lib/appLinks';
import { bestLocatorsRanking, globetrotterRanking } from '../../lib/ranking';
import { openSmsWithBody } from '../../lib/sms';
import { colors, spacing } from '../../lib/theme';
import { Entry, RankingPeriod } from '../../lib/types';
import { CounterTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<CounterTabParamList, 'Groupes'>;

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: 'day', label: 'Jour' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
];

export function GroupsScreen({ route }: Props) {
  const { counterId } = route.params;
  const { session } = useAuth();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<{ user_id: string; pseudo: string }[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [period, setPeriod] = useState<RankingPeriod>('day');
  const [loading, setLoading] = useState(true);

  const [newGroupName, setNewGroupName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const counter = await fetchCounterById(counterId);
      if (!counter.group_id) {
        setGroupId(null);
        setLoading(false);
        return;
      }
      const [group, groupMembers, groupEntries] = await Promise.all([
        fetchGroupById(counter.group_id),
        fetchGroupMembers(counter.group_id),
        fetchEntriesForGroup(counter.group_id),
      ]);
      setGroupId(group.id);
      setGroupName(group.name);
      setInviteCode(group.invite_code);
      setMembers(groupMembers.map((m) => ({ user_id: m.user_id, pseudo: m.profiles.pseudo })));
      setEntries(groupEntries);
    } catch (error) {
      alert('Erreur', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [counterId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleInvitePress() {
    alert(
      'Inviter un ami',
      'Voulez-vous envoyer une invitation à un autre utilisateur à rejoindre votre Compteur ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: () => openSmsWithBody(buildInviteMessage(groupName, inviteCode)),
        },
      ]
    );
  }

  async function handleCreateGroup() {
    if (!session || !newGroupName.trim()) return;
    setBusy(true);
    try {
      const group = await createGroup(session.user.id, newGroupName.trim());
      await updateCounterGroupId(counterId, group.id);
      setNewGroupName('');
      await load();
    } catch (error) {
      alert('Erreur', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <ScreenContainer />;
  }

  if (!groupId) {
    return (
      <ScreenContainer>
        <ScrollView>
          <Text style={styles.title}>Ce compteur est en solo</Text>
          <Text style={styles.subtitle}>
            Partagez-le en créant un groupe autour de lui, pour inviter d’autres personnes à
            cliquer avec vous et comparer vos statistiques.
          </Text>

          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Créer un groupe</Text>
            <TextField
              label="Nom du groupe"
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="ex. Chasseurs de teckels"
            />
            <Button label="Créer" onPress={handleCreateGroup} loading={busy} />
          </Card>

          <Text style={styles.helpText}>
            Pour rejoindre le groupe d’un ami avec un code d’invitation, utilisez plutôt
            « Rejoindre un compteur » depuis l’accueil — cela crée votre propre exemplaire du
            compteur partagé.
          </Text>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const bestLocators = bestLocatorsRanking(members, entries, period);
  const globetrotters = globetrotterRanking(members, entries);

  return (
    <ScreenContainer>
      <ScrollView>
        <Text style={styles.title}>{groupName}</Text>
        <TouchableOpacity onPress={handleInvitePress}>
          <Text style={styles.inviteCode}>Code d’invitation : {inviteCode} 📩</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Meilleurs localisateurs</Text>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            >
              <Text
                style={[styles.periodChipLabel, period === p.key && styles.periodChipLabelActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Card>
          <RankingList rows={bestLocators} />
        </Card>

        <Text style={styles.sectionTitle}>Globe-trotteur</Text>
        <Card>
          <RankingList rows={globetrotters} />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  inviteCode: {
    color: colors.textMuted,
    textDecorationLine: 'underline',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  helpText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.card,
  },
  periodChipActive: {
    backgroundColor: colors.accent,
  },
  periodChipLabel: {
    color: colors.textMuted,
  },
  periodChipLabelActive: {
    color: colors.background,
    fontWeight: '600',
  },
});
