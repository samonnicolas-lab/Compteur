import React, { useEffect, useState } from 'react';
import { AlertButton, Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { AlertRequest, setAlertListener } from '../lib/alert.web';
import { colors, spacing } from '../lib/theme';

function variantForStyle(style: AlertButton['style']): 'primary' | 'secondary' | 'ghost' | 'danger' {
  if (style === 'destructive') return 'danger';
  if (style === 'cancel') return 'secondary';
  return 'primary';
}

// Monté une fois à la racine de l'app (voir App.tsx) : affiche une modale
// thématisée chaque fois que lib/alert.web.ts reçoit un appel à alert(),
// pour remplacer Alert.alert (no-op sur react-native-web).
export function AlertHost() {
  const [request, setRequest] = useState<AlertRequest | null>(null);

  useEffect(() => {
    setAlertListener(setRequest);
    return () => setAlertListener(null);
  }, []);

  function handlePress(button: AlertButton) {
    setRequest(null);
    button.onPress?.();
  }

  if (!request) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setRequest(null)}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{request.title}</Text>
          {!!request.message && <Text style={styles.message}>{request.message}</Text>}
          <View style={styles.buttons}>
            {request.buttons.map((button, index) => (
              <Button
                key={`${button.text ?? 'bouton'}-${index}`}
                label={button.text || 'OK'}
                variant={variantForStyle(button.style)}
                onPress={() => handlePress(button)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  buttons: {
    gap: spacing.sm,
  },
});
