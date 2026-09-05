import { SoundDef } from './types';

// Bibliothèque de sons préchargée dans l'app (assets/sounds/*.wav).
export const SOUND_LIBRARY: SoundDef[] = [
  { id: 'cloche', label: 'Cloche', fileAsset: 'cloche.wav' },
  { id: 'clic', label: 'Clic mécanique', fileAsset: 'clic.wav' },
  { id: 'bip', label: 'Bip électronique', fileAsset: 'bip.wav' },
  { id: 'applaudissement', label: 'Applaudissement', fileAsset: 'applaudissement.wav' },
  { id: 'tambour', label: 'Tambour', fileAsset: 'tambour.wav' },
  { id: 'aboiement', label: 'Aboiement', fileAsset: 'aboiement.wav' },
];

export const SOUND_ASSETS: Record<string, number> = {
  cloche: require('../assets/sounds/cloche.wav'),
  clic: require('../assets/sounds/clic.wav'),
  bip: require('../assets/sounds/bip.wav'),
  applaudissement: require('../assets/sounds/applaudissement.wav'),
  tambour: require('../assets/sounds/tambour.wav'),
  aboiement: require('../assets/sounds/aboiement.wav'),
};

export function getSoundById(id: string): SoundDef | undefined {
  return SOUND_LIBRARY.find((s) => s.id === id);
}
