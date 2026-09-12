import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { alert } from './alert';

// iOS attend "sms:&body=...", Android "sms:?body=...". Sur le web (l'app est
// aussi une PWA), Platform.OS vaut toujours "web" quel que soit l'appareil :
// on distingue un iPhone/iPad d'un Android/desktop via le user-agent.
function smsBodySeparator(): '&' | '?' {
  if (Platform.OS === 'ios') return '&';
  if (Platform.OS === 'android') return '?';
  if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return '&';
  }
  return '?';
}

// Ouvre l'application Messages du téléphone avec le texte pré-rempli. Sans
// destinataire fixé : l'utilisateur choisit à qui l'envoyer.
export async function openSmsWithBody(message: string): Promise<void> {
  const url = `sms:${smsBodySeparator()}body=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
  } catch {
    alert(
      'Impossible d’ouvrir l’application Messages',
      `Copiez ce texte pour l’envoyer manuellement à un ami :\n\n${message}`
    );
  }
}
