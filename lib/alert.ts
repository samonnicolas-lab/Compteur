import { Alert } from 'react-native';

// Sur natif, Alert.alert fonctionne nativement : simple ré-export.
// Voir alert.web.ts pour l'équivalent web (react-native-web n'implémente pas Alert.alert).
export const alert = Alert.alert;
