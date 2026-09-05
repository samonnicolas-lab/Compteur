import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { CounterCard } from '../../components/CounterCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyCounters } from '../../lib/api';
import { colors, spacing } from '../../lib/theme';
import { CounterWithTotal } from '../../lib/types';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { profile, signOut } = useAuth();
  const [counters, setCounters] = useState<CounterWithTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setCounters(await fetchMyCounters());
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes compteurs</Text>
          {profile ? <Text style={styles.pseudo}>Bonjour {profile.pseudo}</Text> : null}
        </View>
        <Button label="Déconnexion" variant="ghost" onPress={signOut} />
      </View>

      <FlatList
        data={counters}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={counters.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              Aucun compteur pour l’instant. Créez-en un pour commencer à suivre vos événements !
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <CounterCard
            counter={item}
            onPress={() => navigation.navigate('CounterTabs', { counterId: item.id })}
          />
        )}
      />

      <Button
        label="+ Créer un compteur"
        onPress={() => navigation.navigate('CreateCounter')}
        style={styles.createButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '700',
  },
  pseudo: {
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  createButton: {
    marginTop: spacing.md,
  },
});
