import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

import App from './App';

// react-native-screens n'active ses optimisations (dont le masquage propre
// des écrans inactifs, ex. les onglets non sélectionnés) que sur natif par
// défaut — sur le web, sans cet appel explicite, TOUS les onglets restent
// visibles superposés en permanence. Invisible tant que chaque écran avait
// un fond opaque (avant l'ajout de l'image de fond de l'app).
enableScreens();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
