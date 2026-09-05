# Compteur

Application mobile (React Native + Expo) permettant de créer des compteurs manuels
personnalisés : un gros bouton à appuyer à chaque événement, avec son, géolocalisation
optionnelle, photo optionnelle, statistiques, export CSV et classements de groupe.

Implémentation basée sur le cahier des charges fourni, conservé dans le dépôt sous
[`docs/cahier-des-charges.md`](./docs/cahier-des-charges.md).

Voir aussi [`RAPPORT.md`](./RAPPORT.md) (bilan de la réalisation et de la validation)
et [`HANDOVER.md`](./HANDOVER.md) (comment reprendre le projet).

## Stack

- **Expo SDK 57** (React Native 0.86, React 19, TypeScript strict)
- **Supabase** : Auth (email/mot de passe), Postgres, Storage, RLS
- `expo-location`, `expo-image-picker`, `expo-audio`, `expo-file-system`, `expo-sharing`
- `react-native-maps`, `@react-navigation` (stack + bottom tabs)
- Graphique en barres et logique métier maison (pas de dépendance de charting lourde)

> Écart volontaire par rapport au cahier des charges : `expo-audio` est utilisé à la
> place d'`expo-av` (mentionné à titre indicatif) car `expo-av` est en fin de vie côté
> Expo et `expo-audio` est le module officiel pour SDK 57. L'usage reste identique
> (lecture d'un son court au clic).

## Mise en route

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer le projet Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL du projet, exécutez le contenu de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   Ce script crée :
   - les tables `profiles`, `sounds`, `counters`, `groups`, `group_members`, `entries` ;
   - toutes les policies RLS (un utilisateur ne voit que ses compteurs et ceux des
     groupes dont il est membre) ;
   - un trigger qui crée automatiquement un `profiles` (avec le pseudo choisi à
     l'inscription) à la création d'un compte ;
   - le bucket Storage `entry-photos` (public en lecture) pour les photos jointes
     aux clics.
3. Récupérez l'URL du projet et la clé publique (`anon key`) dans
   *Project Settings → API*.

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
# puis éditez .env avec l'URL et la clé anon de votre projet Supabase
```

### 4. Lancer l'app

```bash
npx expo start
```

Scannez le QR code avec Expo Go, ou lancez un simulateur iOS/émulateur Android.

## Scripts disponibles

| Commande            | Description                                      |
|----------------------|---------------------------------------------------|
| `npm start`          | Démarre Metro / Expo                              |
| `npm run android`    | Démarre sur émulateur/appareil Android            |
| `npm run ios`        | Démarre sur simulateur iOS (macOS uniquement)      |
| `npm test`           | Lance la suite de tests Jest                       |
| `npm run typecheck`  | Vérifie les types TypeScript (`tsc --noEmit`)      |
| `npm run lint`       | Lint ESLint (config `eslint-config-expo`)          |

## Structure du projet

```
App.tsx                        Point d'entrée (providers + navigation)
contexts/AuthContext.tsx       Session Supabase, profil, connexion/inscription
navigation/                    Stack racine, stack d'auth, tabs par compteur
screens/
  auth/                        Connexion / inscription
  home/                        Accueil (liste des compteurs)
  createCounter/                Assistant de création (5 étapes)
  counter/                      Écran d'utilisation (gros bouton)
  stats/                         Statistiques + export CSV
  groups/                        Classements de groupe
  map/                            Carte des observations
components/                    UI réutilisable (Button, Card, BarChart SVG, ...)
lib/                           Logique métier pure + accès Supabase
  api.ts                        Requêtes Supabase (comptes, groupes, entries...)
  csv.ts / exportCsv.ts         Formatage CSV + export/partage natif
  dateRanges.ts                 Bornes jour/semaine/mois/année
  geo.ts                        Arrondi de coordonnées (~11m), clustering carte
  ranking.ts                    Classements "Meilleurs localisateurs" / "Globe-trotteur"
  __tests__/                    Tests unitaires de toute la logique ci-dessus
supabase/migrations/0001_init.sql  Schéma + RLS + seed des sons
assets/sounds/*.wav             Bibliothèque de sons (voir note ci-dessous)
```

## Modèle "compteur partagé"

Quand un compteur est partagé dans un groupe, **chaque membre possède sa propre ligne
`counters`** (créée via l'assistant, en rejoignant le groupe), toutes reliées au même
`group_id`. Les classements (écran Groupes) agrègent les `entries` de tous les
compteurs d'un même `group_id`. Les écrans Statistiques et Carte, eux, restent
« propres à un compteur » : ils n'affichent que les clics du compteur ouvert (donc
les clics du membre courant), conformément au cahier des charges.

## Bibliothèque de sons

Les 6 sons (`cloche`, `clic`, `bip`, `applaudissement`, `tambour`, `aboiement`) sont
des sons courts **synthétisés par script** (`assets/sounds/*.wav`), en l'absence
d'accès à une bibliothèque audio libre de droits dans cet environnement. Ce sont des
placeholders fonctionnels : remplacez-les par de vrais fichiers audio (même nom de
fichier) avant toute publication, si vous le souhaitez.

## Tests et validation effectués dans cet environnement

Cet environnement de développement n'a pas de simulateur iOS/Android ni de projet
Supabase live (pas de Docker fonctionnel pour un Supabase local). Ce qui a été
validé automatiquement, à plusieurs reprises :

- **Tests unitaires** (`npm test`) : 35 tests Jest — logique métier pure (CSV,
  bornes de dates, arrondi géographique ~11m, classements) et rendu de composants
  (`@testing-library/react-native`). Exécutés avec succès sur plusieurs runs
  consécutifs.
- **TypeScript** (`npm run typecheck`) : 0 erreur en mode strict.
- **ESLint** (`npm run lint`, config `eslint-config-expo`) : 0 erreur.
- **Bundling Metro réel** (`expo export --platform android`) : l'application entière
  (1120 modules, navigation, écrans, assets) se bundle sans erreur en bytecode
  Hermes — un test de fumée fort qui aurait révélé tout import cassé ou toute
  incompatibilité de dépendance.

**Non testé dans cet environnement** (nécessite un appareil/simulateur et un vrai
projet Supabase) : le parcours utilisateur de bout en bout (inscription réelle,
permissions natives, capture photo/son sur device, affichage de la carte). Voir
`HANDOVER.md` pour la marche à suivre.
