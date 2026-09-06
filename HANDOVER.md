# Document de reprise — App Compteur

Ce document explique comment reprendre ce projet là où il en est.

## État actuel

- **Branche** : `claude/app-cahier-charges-pgwb0j` (poussée sur `origin`)
- **Aucune pull request n'a été ouverte** (non demandé)
- Le code compile, passe le typecheck, le lint et les tests unitaires — voir
  `RAPPORT.md` pour le détail.
- **L'app a été testée sur un vrai iPhone** (Expo Go) contre un vrai projet
  Supabase, avec deux comptes distincts, le 06/09. Le parcours complet du
  cahier des charges fonctionne — voir la section 0 de `RAPPORT.md` pour le
  détail des bugs trouvés et corrigés pendant cette session (essentiellement
  des policies RLS Supabase manquantes, invisibles en local sans base réelle).

## Pour reprendre le développement en local

```bash
git clone <url-du-repo>
cd Compteur
git checkout claude/app-cahier-charges-pgwb0j
npm install
```

### 1. Créer et configurer le projet Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Copiez tout le contenu de `supabase/migrations/0001_init.sql` dans l'éditeur
   SQL du projet et exécutez-le. Cela crée les tables, les policies RLS, le
   trigger de création de profil et le bucket Storage `entry-photos`.
3. `cp .env.example .env` puis renseignez `EXPO_PUBLIC_SUPABASE_URL` et
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API dans Supabase).

### 2. Lancer l'app sur un appareil ou un simulateur

```bash
npx expo start
```

- Sur téléphone : installez **Expo Go** et scannez le QR code.
- Sur simulateur iOS : `npx expo start --ios` (macOS uniquement).
- Sur émulateur Android : `npx expo start --android`.

### 3. Parcours déjà validé (à retester si vous modifiez le schéma SQL)

1. Créer un compte (pseudo + email + mot de passe) → un `profiles` apparaît
   dans Supabase.
2. Créer un compteur solo avec géoloc + photo activées → le clic, la demande
   de permission, et la ligne dans `entries` fonctionnent.
3. Créer un second compte, depuis l'Accueil bouton **+ Nouveau compteur** →
   **Rejoindre un compteur** → code d'invitation du premier compte → l'écran
   Groupes affiche bien les deux membres et un classement cohérent.
4. Export CSV (bouton dans Statistiques) ouvre bien la fenêtre de partage
   native avec un fichier `.csv` correctement formé.
5. Carte avec plusieurs clics géolocalisés : clusters, popup avec liste des
   clics et miniatures photo.
6. Réinitialisation d'un compteur (bouton rouge dans Statistiques, avec
   confirmation).

⚠️ Si vous repartez d'un projet Supabase **neuf** en ré-exécutant
`supabase/migrations/0001_init.sql` en une seule fois, tout devrait fonctionner
du premier coup (le script est idempotent et inclut déjà toutes les policies
RLS découvertes nécessaires). Les bugs listés en section 0 de `RAPPORT.md`
ne se sont manifestés que parce que le schéma avait été appliqué en plusieurs
fois pendant le développement, avant que ces policies ne soient ajoutées.

## Limitations connues à traiter avant une mise en production

- **Sons placeholder** : `assets/sounds/*.wav` sont synthétisés par script
  (`gen_sounds.py`, non conservé dans le repo — à regénérer ou remplacer par de
  vrais fichiers audio de même nom si le rendu ne convient pas).
- **Polices** : le cahier des charges demande Lora (titres) et Public Sans
  (corps). `lib/theme.ts` définit ces noms de police mais **aucune police n'est
  chargée** (`expo-font` + `@expo-google-fonts/lora` /
  `@expo-google-fonts/public-sans` à ajouter) — actuellement les polices système
  par défaut sont utilisées comme repli.
- **Aucun test end-to-end** (Detox/Maestro) — seulement des tests unitaires de
  logique et de composants isolés.
- **Compression photo** : les photos sont envoyées telles quelles (qualité 0.6 à
  la capture) sans redimensionnement supplémentaire côté client.
- **Pas de pagination** : `fetchMyCounters`/`fetchEntriesForCounter` chargent tout
  d'un coup ; à revoir si un compteur accumule beaucoup d'entrées.

## Prochaines étapes suggérées

1. Tester le parcours complet sur un vrai appareil (voir section précédente).
2. Charger les polices Lora / Public Sans si l'identité visuelle exacte du
   cahier des charges est requise.
3. Remplacer les sons placeholder si besoin d'un rendu audio plus soigné.
4. Ajouter un pipeline CI (GitHub Actions) exécutant `npm run typecheck`,
   `npm run lint` et `npm test` sur chaque push — les scripts existent déjà.
5. Envisager EAS Build pour produire des builds installables (dev client) plutôt
   que de rester sur Expo Go, notamment pour tester `react-native-maps` en
   conditions réelles.

## Où trouver quoi

- Vue d'ensemble de la structure du code : voir la section « Structure du
  projet » dans `README.md`.
- Détail de ce qui a été validé automatiquement et des décisions techniques :
  `RAPPORT.md`.
- Cahier des charges d'origine : `docs/cahier-des-charges.md`.
