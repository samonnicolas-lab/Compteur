import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { LocationEntriesModal } from '../../components/LocationEntriesModal';
import { alert } from '../../lib/alert';
import { fetchEntriesForCounter } from '../../lib/api';
import { clusterEntriesByLocation, MapCluster } from '../../lib/geo';
import { colors, spacing } from '../../lib/theme';
import { CounterTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<CounterTabParamList, 'Carte'>;

const DEFAULT_REGION = {
  // France métropolitaine, vue large par défaut si aucune entrée géolocalisée.
  latitude: 46.6,
  longitude: 2.2,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export function MapScreen({ route }: Props) {
  const { counterId } = route.params;
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);

  const load = useCallback(async () => {
    try {
      const entries = await fetchEntriesForCounter(counterId);
      setClusters(clusterEntriesByLocation(entries));
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

  const initialRegion = clusters[0]
    ? { latitude: clusters[0].lat, longitude: clusters[0].lng, latitudeDelta: 0.2, longitudeDelta: 0.2 }
    : DEFAULT_REGION;

  if (loading) {
    return <View style={styles.container} />;
  }

  if (clusters.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Aucune entrée géolocalisée pour ce compteur pour le moment.
        </Text>
      </View>
    );
  }

  return (
    <>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {clusters.map((cluster) => (
          <Marker
            key={cluster.key}
            coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
            onPress={() => setSelectedCluster(cluster)}
          />
        ))}
      </MapView>
      <LocationEntriesModal cluster={selectedCluster} onClose={() => setSelectedCluster(null)} />
    </>
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
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
});
