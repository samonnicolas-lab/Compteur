import { AlertButton } from 'react-native';

// react-native-web n'implémente pas Alert.alert (no-op silencieux). On redirige
// les appels vers AlertHost.web.tsx, monté une fois à la racine de l'app, qui
// affiche une vraie modale dans le thème de l'app.
export interface AlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (request: AlertRequest) => void;

let listener: Listener | null = null;

// Appelé uniquement par AlertHost.web.tsx pour s'enregistrer comme destinataire.
export function setAlertListener(fn: Listener | null): void {
  listener = fn;
}

export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  const resolvedButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
  if (listener) {
    listener({ title, message, buttons: resolvedButtons });
    return;
  }
  // Filet de sécurité si AlertHost n'est pas encore monté.
  if (typeof window !== 'undefined') {
    window.alert(message ? `${title}\n\n${message}` : title);
  }
}
