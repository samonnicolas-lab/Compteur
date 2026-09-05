# Rapport de réalisation — App Compteur

Date : 2026-09-05
Branche : `claude/app-cahier-charges-pgwb0j`
Commit : `726345d`

## 1. Contexte

Développement en autonomie de l'application mobile « Compteur » (créateur de
compteurs manuels personnalisés) à partir du cahier des charges fourni
(`docs/cahier-des-charges.md`), sur un dépôt initialement vide.

## 2. Ce qui a été livré

### Application (React Native / Expo SDK 57, TypeScript strict)

- **Authentification** : inscription (email + mot de passe + pseudo) et connexion via
  Supabase Auth, session persistante.
- **Accueil** : liste des compteurs de l'utilisateur (cartes emoji + nom + total de
  clics), bouton de création.
- **Assistant de création de compteur** (5 étapes) : nom, emoji (clavier système),
  son (bibliothèque avec écoute avant validation), options géoloc/photo, partage
  (solo / créer un groupe / rejoindre un groupe par code d'invitation).
- **Écran de comptage** : gros bouton emoji, son immédiat au clic, capture de
  géolocalisation en arrière-plan (non bloquante — l'entrée est enregistrée
  immédiatement puis complétée avec les coordonnées dès qu'elles arrivent),
  étape photo optionnelle et « passable », compteur total permanent.
- **Statistiques** : compteurs jour/semaine/mois/année, graphique en barres des
  7 derniers jours (SVG custom, sans dépendance de charting lourde), export CSV
  avec partage natif du fichier.
- **Groupes** : création/adhésion à un groupe par code d'invitation, classement
  « Meilleurs localisateurs » (sélecteur jour/mois/année) et « Globe-trotteur »
  (lieux distincts ~11m, tout l'historique), affichage podium/liste.
- **Carte** : regroupement des entrées géolocalisées par lieu (~11m), popup avec
  nombre de clics et miniature de la dernière photo.
- **Permissions** : déclarées et gérées avec repli gracieux (le compteur reste
  utilisable sans géoloc/photo si l'utilisateur refuse).

### Backend (Supabase)

- Schéma SQL complet (`supabase/migrations/0001_init.sql`) : tables `profiles`,
  `sounds`, `counters`, `groups`, `group_members`, `entries` ; policies Row Level
  Security ; trigger de création automatique de profil ; bucket Storage pour les
  photos.

### Bibliothèque de sons

6 sons courts synthétisés par script Python (`assets/sounds/*.wav`) — cloche, clic,
bip, applaudissement, tambour, aboiement. **Placeholders fonctionnels**, faute
d'accès à une bibliothèque audio libre de droits dans cet environnement.

## 3. Décisions techniques assumées

| Décision | Justification |
|---|---|
| `expo-audio` au lieu d'`expo-av` | `expo-av` était mentionné à titre indicatif dans le cahier des charges ; `expo-audio` est le module officiel Expo pour SDK 57, l'usage (son court au clic) est identique. |
| Graphique en barres SVG custom au lieu de `victory-native` | Le cahier des charges proposait explicitly « victory-native **ou** composants custom » ; `victory-native` (v41+) dépend de `react-native-skia`, plus lourd à installer sans risque réseau. |
| Stats et Carte scopées au compteur individuel (`counterId`), classements scopés au groupe (`group_id`) | Cohérent avec le modèle « chaque membre clique sur son propre exemplaire du compteur, mais les classements sont communs » du cahier des charges, et avec les titres de section (« Statistiques *propres à un compteur* », « Carte *propre à un compteur* »). |
| Bouton géant circulaire (pas capsule) pour l'écran de comptage | Le motif « capsule asymétrique » est prescrit pour les boutons/cartes standards ; le bouton de comptage est un cas particulier (grande cible tactile), un cercle est plus adapté. |

## 4. Validation effectuée (et répétée)

Cet environnement de développement **n'a ni simulateur iOS/Android, ni projet
Supabase actif** (Docker présent mais démon non disponible → pas de Supabase local).
La validation s'est donc concentrée sur tout ce qui est vérifiable statiquement et
en logique pure, exécuté à plusieurs reprises pour confirmer la stabilité :

| Vérification | Résultat | Répétitions |
|---|---|---|
| `npm run typecheck` (`tsc --noEmit`, strict) | ✅ 0 erreur | 2 |
| `npm run lint` (ESLint, `eslint-config-expo`) | ✅ 0 erreur | 2 |
| `npm test` (Jest — logique métier + composants) | ✅ 35/35 tests | 5 exécutions consécutives, résultat stable |
| `expo export --platform android` (bundling Metro réel, 1120 modules) | ✅ bundle Hermes généré sans erreur | 2 |

Les 35 tests couvrent : formatage CSV et export (échappement, slug de nom de
fichier), bornes de dates jour/semaine/mois/année et bucket 7 jours, arrondi
géographique (~11m) et clustering carte, classements (meilleurs localisateurs,
globe-trotteur) y compris cas limites (membres à zéro clic, entrées hors période,
entrées sans coordonnées), génération/normalisation de code d'invitation, et rendu
de composants UI (`Button`, `RankingList`, `EmojiInput`) avec interactions.

## 5. Non testé dans cet environnement

- Le parcours utilisateur réel de bout en bout (inscription, permissions natives,
  prise de photo, écoute des sons, carte) — nécessite un appareil ou un
  simulateur.
- L'intégration avec un vrai projet Supabase (RLS en conditions réelles,
  upload de photos, temps réel).
- Le rendu visuel final (couleurs, typographies, motif capsule) sur device.

Voir `HANDOVER.md` pour la marche à suivre afin de compléter cette validation.
