# App mobile — Créateur de compteurs manuels

## Objectif
Application permettant à un utilisateur de créer ses propres compteurs manuels personnalisés (un bouton à appuyer à chaque événement), avec pour chaque compteur : un son au clic, une géolocalisation optionnelle, une photo optionnelle, des statistiques (jour/semaine/mois/année), un export CSV, et la possibilité de partager un compteur avec un groupe d'utilisateurs pour un classement commun.

L'usage "teckels croisés dans la rue" devient un exemple d'utilisation parmi d'autres — l'app est désormais générique et permet de créer n'importe quel type de compteur (teckels, mais aussi n'importe quel événement que l'utilisateur veut suivre).

## Parcours utilisateur (vue d'ensemble)
1. L'utilisateur se connecte (compte + pseudo)
2. Il arrive sur une **page d'accueil** listant tous ses compteurs existants
3. Il crée un nouveau compteur via un court assistant de configuration (nom, icône emoji, son, options)
4. Il utilise le compteur créé : un gros bouton à appuyer, qui joue un son, capture la position et éventuellement une photo selon les options choisies à la création
5. Il consulte les statistiques, la carte ou le classement du groupe propres à ce compteur, et peut exporter les données en CSV

## Stack technique recommandée
- **React Native + Expo** (build unique iOS/Android)
- **Supabase** : Auth (email/mot de passe), base Postgres, Storage (photos + fichiers CSV générés), API temps réel
- **expo-location** — géolocalisation
- **expo-image-picker** — photo (caméra ou galerie)
- **expo-av** — lecture des sons au clic
- **expo-file-system** + **expo-sharing** — génération et partage du fichier CSV
- **react-native-maps** — carte des observations
- **victory-native** ou composants custom — graphiques de statistiques
- **React Navigation** (bottom tabs + stack) — navigation entre Accueil, Compteur actif, Statistiques, Groupes, Carte

## Modèle de données (Postgres / Supabase)

### `profiles`
| champ | type | description |
|---|---|---|
| id | uuid (PK) | lié à auth.users |
| pseudo | text | nom affiché dans les classements |
| created_at | timestamp | |

### `sounds` (bibliothèque de sons, préchargée dans l'app)
| champ | type | description |
|---|---|---|
| id | text (PK) | identifiant du son, ex. `cloche`, `clic`, `aboiement`, `applaudissement`, `bip`, `tambour` |
| label | text | nom affiché |
| file_asset | text | référence du fichier audio embarqué dans l'app |

### `counters` (un compteur créé par un utilisateur)
| champ | type | description |
|---|---|---|
| id | uuid (PK) | |
| owner_id | uuid (FK profiles) | créateur du compteur |
| name | text | nom donné par l'utilisateur |
| emoji | text | emoji choisi comme icône |
| sound_id | text (FK sounds) | son joué à chaque clic |
| geoloc_enabled | boolean | capturer la position à chaque clic |
| photo_enabled | boolean | proposer une photo à chaque clic |
| group_id | uuid (FK groups, nullable) | groupe associé si le compteur est partagé |
| created_at | timestamp | |

### `groups`
| champ | type | description |
|---|---|---|
| id | uuid (PK) | |
| name | text | nom du groupe |
| invite_code | text (unique) | code à partager pour rejoindre |
| owner_id | uuid (FK profiles) | créateur |
| created_at | timestamp | |

### `group_members`
| champ | type | description |
|---|---|---|
| group_id | uuid (FK groups) | |
| user_id | uuid (FK profiles) | |
| joined_at | timestamp | |

### `entries` (chaque clic sur un compteur)
| champ | type | description |
|---|---|---|
| id | uuid (PK) | |
| counter_id | uuid (FK counters) | compteur concerné |
| user_id | uuid (FK profiles) | auteur du clic |
| timestamp | timestamptz | date/heure du clic |
| lat | double (nullable) | latitude, si géoloc activée |
| lng | double (nullable) | longitude, si géoloc activée |
| accuracy | double (nullable) | précision GPS en mètres |
| photo_url | text (nullable) | URL de la photo dans Supabase Storage |

## Authentification
- Écran de connexion / inscription (email + mot de passe, via Supabase Auth)
- Choix d'un pseudo à l'inscription (utilisé dans les classements)
- Session persistante entre les lancements

## Fonctionnalités par écran

### 1. Accueil
- Liste de tous les compteurs créés par l'utilisateur, affichés sous forme de cartes avec l'emoji choisi, le nom, et le total de clics
- Bouton "+ Créer un compteur" toujours visible
- Tap sur un compteur → ouvre son écran dédié (bouton de comptage)

### 2. Création d'un compteur (assistant en plusieurs étapes)
- **Nom** du compteur (texte libre)
- **Icône** : choix d'un emoji (champ de saisie limité à un caractère, ouvrant le clavier emoji du système — pas de librairie externe nécessaire)
- **Son** : choix dans la bibliothèque de sons prédéfinis, avec un bouton d'écoute pour chaque son avant de valider
- **Options** : activer/désactiver la géolocalisation automatique à chaque clic, activer/désactiver la proposition de photo à chaque clic
- **Partage** : garder le compteur en solo, créer un nouveau groupe autour de ce compteur, ou rejoindre un groupe existant via un code d'invitation (le compteur devient alors partagé : chaque membre du groupe clique sur son propre exemplaire du compteur, mais les statistiques et classements sont communs)

### 3. Écran d'un compteur (utilisation)
- Gros bouton avec l'emoji du compteur, occupant l'essentiel de l'écran
- Au tap :
  - jouer immédiatement le son choisi à la création
  - capturer la position en arrière-plan si l'option est activée (ne bloque pas l'utilisation si la position n'est pas trouvée)
  - si l'option photo est activée, proposer de prendre une photo ou d'en choisir une (étape que l'utilisateur peut passer)
  - enregistrer l'entrée (`entries`) liée à ce compteur
- Compteur total affiché en permanence sur l'écran
- Accès rapide depuis cet écran vers Statistiques, Carte, et Classement du groupe (si le compteur est partagé)

### 4. Statistiques (propres à un compteur)
- 4 compteurs : aujourd'hui / cette semaine / ce mois-ci / cette année
- Graphique en barres des 7 derniers jours
- Bouton **"Exporter en CSV"** : génère un fichier avec une ligne par entrée (colonnes : date, heure, compteur, latitude, longitude, présence d'une photo) et ouvre la fenêtre de partage du téléphone (envoyer par mail, enregistrer dans les fichiers, etc.)

### 5. Groupes (si le compteur est partagé)
- Rejoindre un groupe via un code d'invitation, ou créer un nouveau groupe pour un compteur
- **Classement "Meilleurs localisateurs"** : nombre de clics par membre, avec sélecteur de période — jour / mois / année
- **Classement "Globe-trotteur"** : classement par nombre de lieux distincts où un membre a enregistré un clic (regroupement des entrées d'un même membre par coordonnées arrondies à ~11m, puis comptage des lieux uniques)
- Affichage type podium/liste avec pseudo et score

### 6. Carte (propre à un compteur)
- Repères regroupant les entrées géolocalisées proches, avec le nombre de clics enregistrés à cet endroit
- Tap sur un repère → popup avec le nombre d'entrées et, si disponible, la miniature de la dernière photo prise à cet endroit

## Bibliothèque de sons
Prévoir une sélection de sons courts (< 1 seconde) embarqués dans l'app, par exemple : cloche, clic mécanique, bip électronique, applaudissement, tambour, aboiement. Chaque son est un petit fichier audio inclus dans le projet (dossier `assets/sounds`), lu via `expo-av` au moment du clic.

## Export CSV — format
Une ligne par clic enregistré :
```
date,heure,compteur,latitude,longitude,photo
2026-09-05,14:32,Teckels croisés,48.1173,-1.6778,oui
```
Le fichier est généré à la volée (pas stocké en permanence côté serveur) et proposé via la fenêtre de partage native du téléphone.

## Permissions à déclarer
- `NSLocationWhenInUseUsageDescription` (iOS) / `ACCESS_FINE_LOCATION` (Android) — pour les compteurs avec géolocalisation activée
- `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` (iOS) / `CAMERA`, `READ_MEDIA_IMAGES` (Android) — pour les compteurs avec photo activée
- Gérer proprement le refus de chaque permission : le compteur reste utilisable, simplement sans position et/ou sans photo pour ce clic

## Règles de gestion des classements
- Un classement se calcule toujours au sein d'un groupe, pour le compteur partagé auquel il est associé
- "Jour" = jour calendaire en cours ; "mois" = mois calendaire en cours ; "année" = année civile en cours
- Le classement "globe-trotteur" n'a pas de filtre temporel : il porte sur tout l'historique du membre pour ce compteur

## Identité visuelle
- Fond brun foncé `#2B1B12`, cartes `#3D2817`
- Accent moutarde `#D4A24E` / `#E8C784`
- Vert olive `#8A9A5B` pour les graphiques
- Typographie : une serif chaleureuse en titres (ex. Lora), sans-serif en corps de texte (ex. Public Sans / système)
- Motif visuel récurrent : formes en "capsule" asymétrique (border-radius très arrondi à gauche/droite, plus discret en haut/bas) sur les boutons et cartes
- Chaque compteur se démarque visuellement par son emoji plutôt que par une charte graphique dédiée — l'identité de l'app reste unifiée, la personnalisation se fait au niveau du contenu (nom + emoji + son)

## Étapes de démarrage suggérées pour Claude Code
1. `npx create-expo-app compteur-app`
2. Créer un projet Supabase (Auth + tables Postgres + bucket Storage pour les photos)
3. Installer les dépendances : `@supabase/supabase-js`, `expo-location`, `expo-image-picker`, `expo-av`, `expo-file-system`, `expo-sharing`, `react-native-maps`, `@react-navigation/native` + `@react-navigation/bottom-tabs`
4. Créer les tables `profiles`, `sounds`, `counters`, `groups`, `group_members`, `entries` dans Supabase (Row Level Security : un utilisateur ne voit que ses propres compteurs et ceux des groupes dont il est membre)
5. Ajouter les fichiers audio de la bibliothèque de sons dans `assets/sounds`
6. Construire l'écran d'authentification, puis l'Accueil, l'assistant de création de compteur, l'écran de comptage, les Statistiques (+ export CSV), les Groupes et la Carte
7. Tester avec `npx expo start` (Expo Go sur téléphone, ou simulateur)
