import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { alert } from '../lib/alert';
import { colors, spacing } from '../lib/theme';

// Chrome/Edge/Android déclenchent cet évènement quand le site est
// installable (manifest + service worker valides) ; il n'existe pas dans les
// types DOM par défaut.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    !!window.matchMedia?.('(display-mode: standalone)')?.matches ||
    // Propriété spécifique à Safari iOS, absente des types DOM standards.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// "Ajouter à l'écran d'accueil" n'a de sens que sur le web (l'app native est
// déjà installée) et pas si le site tourne déjà en mode standalone (déjà
// ajouté). Android/Chrome expose un vrai déclencheur natif
// (beforeinstallprompt) ; iOS Safari ne propose aucune API équivalente, on
// se limite donc à afficher la marche à suivre manuelle.
export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(Platform.OS === 'web' && isStandalone());

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setDeferredPrompt(null);
      setInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (Platform.OS !== 'web' || installed) {
    return null;
  }

  async function handlePress() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
      return;
    }

    if (isIOS()) {
      alert(
        'Ajouter à l’écran d’accueil',
        'Appuyez sur l’icône Partager (le carré avec la flèche vers le haut) en bas de Safari, puis choisissez « Sur l’écran d’accueil ».'
      );
      return;
    }

    alert(
      'Ajouter à l’écran d’accueil',
      'Ouvrez le menu de votre navigateur (souvent en haut ou en bas à droite) et choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ».'
    );
  }

  return (
    <TouchableOpacity accessibilityRole="button" onPress={handlePress} style={styles.button}>
      <Text style={styles.label}>📲 Ajouter à l’écran d’accueil</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.accentLight,
    fontSize: 13,
    fontWeight: '600',
  },
});
