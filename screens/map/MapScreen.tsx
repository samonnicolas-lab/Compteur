import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

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

  const load = useCallback(async () => {
    try {
      const entries = await fetchEntriesForCounter(counterId);
      setClusters(clusterEntriesByLocation(entries));
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
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
    <MapView style={styles.map} initialRegion={initialRegion}>
      {clusters.map((cluster) => (
        <Marker key={cluster.key} coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}>
          <Callout>
            <View style={styles.callout}>
              <Text style={styles.calloutCount}>{cluster.count} clic{cluster.count > 1 ? 's' : ''}</Text>
              {cluster.latestPhotoUrl ? (
                <Image source={{ uri: cluster.latestPhotoUrl }} style={styles.calloutImage} />
              ) : null}
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
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
  callout: {
    minWidth: 120,
    alignItems: 'center',
  },
  calloutCount: {
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  calloutImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
});
