import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LocationEntriesModal } from '../../components/LocationEntriesModal';
import { alert } from '../../lib/alert';
import { fetchEntriesForCounter } from '../../lib/api';
import { clusterEntriesByLocation, MapCluster } from '../../lib/geo';
import { colors, spacing } from '../../lib/theme';
import { CounterTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<CounterTabParamList, 'Carte'>;

// France métropolitaine, vue large par défaut si aucune entrée géolocalisée.
const DEFAULT_CENTER: [number, number] = [46.6, 2.2];
const DEFAULT_ZOOM = 6;
const SINGLE_CLUSTER_ZOOM = 14;

// Icône par défaut de Leaflet : ses images sont référencées en chemin relatif
// au bundle JS, ce qui ne fonctionne pas une fois packagé par Metro. On la
// reconstruit ici avec les mêmes images, chargées comme modules (donc avec
// une URL correcte quel que soit le dossier de déploiement).
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export function MapScreen({ route }: Props) {
  const { counterId } = route.params;
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const onMarkerPressRef = useRef((cluster: MapCluster) => setSelectedCluster(cluster));

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

  // Initialise la carte Leaflet une seule fois, sur le noeud DOM du conteneur.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redessine les marqueurs à chaque changement de clusters, et recadre la vue.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = clusters.map((cluster) => {
      const marker = L.marker([cluster.lat, cluster.lng]).addTo(map);
      marker.on('click', () => onMarkerPressRef.current(cluster));
      return marker;
    });

    if (clusters.length === 1) {
      map.setView([clusters[0].lat, clusters[0].lng], SINGLE_CLUSTER_ZOOM);
    } else if (clusters.length > 1) {
      const bounds = L.latLngBounds(clusters.map((c) => [c.lat, c.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [clusters]);

  return (
    <>
      <View style={styles.container}>
        {!loading && clusters.length === 0 && (
          <View style={styles.emptyOverlay} pointerEvents="none">
            <Text style={styles.emptyText}>
              Aucune entrée géolocalisée pour ce compteur pour le moment.
            </Text>
          </View>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </View>
      <LocationEntriesModal cluster={selectedCluster} onClose={() => setSelectedCluster(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 1000,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
  },
});
