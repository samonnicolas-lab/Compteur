import React, { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { formatDateTime } from '../lib/dateRanges';
import { MapCluster } from '../lib/geo';
import { colors, spacing } from '../lib/theme';

interface Props {
  cluster: MapCluster | null;
  onClose: () => void;
}

export function LocationEntriesModal({ cluster, onClose }: Props) {
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);

  return (
    <Modal visible={!!cluster} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {cluster?.count} clic{cluster && cluster.count > 1 ? 's' : ''} à cet endroit
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={onClose}>
              <Text style={styles.close}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={cluster?.entries ?? []}
            keyExtractor={(item, index) => `${item.timestamp}-${index}`}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                {item.photoUrl ? (
                  <TouchableOpacity onPress={() => setEnlargedPhotoUrl(item.photoUrl!)}>
                    <Image source={{ uri: item.photoUrl }} style={styles.thumbnail} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.thumbnailPlaceholder} />
                )}
                <View>
                  {item.pseudo && <Text style={styles.rowPseudo}>{item.pseudo}</Text>}
                  <Text style={styles.rowText}>{formatDateTime(item.timestamp)}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </View>

      <Modal
        visible={!!enlargedPhotoUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setEnlargedPhotoUrl(null)}
      >
        <TouchableOpacity
          style={styles.zoomOverlay}
          activeOpacity={1}
          onPress={() => setEnlargedPhotoUrl(null)}
        >
          {enlargedPhotoUrl && (
            <Image
              source={{ uri: enlargedPhotoUrl }}
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1,
  },
  close: {
    color: colors.accentLight,
    fontWeight: '600',
  },
  list: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.textMuted,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: spacing.md,
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: spacing.md,
    backgroundColor: colors.background,
  },
  rowPseudo: {
    color: colors.accentLight,
    fontSize: 13,
    fontWeight: '600',
  },
  rowText: {
    color: colors.text,
    fontSize: 15,
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomedImage: {
    width: '100%',
    height: '100%',
  },
});
