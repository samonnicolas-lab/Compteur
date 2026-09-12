# Rapport de réalisation — App Compteur

Date de la version initiale : 2026-09-05 · Mise à jour : 2026-09-12
Branche : `claude/app-cahier-charges-pgwb0j`

## -1. Mise à jour du 12/09 — version web (PWA), en remplacement du mobile

À la demande explicite de l'utilisateur, l'app tourne désormais **comme une
page web responsive (PWA)**, plutôt que de nécessiter une distribution via
l'App Store ou le Play Store. Cette version web **remplace** le parcours
Expo Go + tunnel utilisé jusqu'ici pour les tests. Elle réutilise la quasi
totalité du code existant grâce à `react-native-web` ; seuls quelques
fichiers ont une variante web (suffixe `.web.ts(x)`, résolue automatiquement
par Metro selon la plateforme).

### Ce qui a été ajouté

- **Bundle web + PWA installable** : export via `npx expo export --platform
  web`, manifest (`public/manifest.json`), icônes (192/512/maskable),
  favicon, service worker réseau-prioritaire (`public/sw.js`, qui laisse
  toujours passer les appels Supabase), `public/index.html` personnalisé
  (lien manifest, apple-touch-icon, enregistrement du service worker).
  `app.json` configure `web.themeColor`/`description`/`lang` et
  `experiments.baseUrl = "/Compteur"` (hébergement en sous-dossier GitHub
  Pages).
- **Carte sur le web** : `screens/map/MapScreen.web.tsx`, avec Leaflet
  utilisé directement (pas `react-leaflet`, par prudence vis-à-vis de React
  19) sur fond OpenStreetMap — réutilise `clusterEntriesByLocation` et
  `LocationEntriesModal`, comportement identique à la carte native.
- **Modules natifs adaptés au web** :
  - `Alert.alert` de React Native est un **no-op silencieux** sur
    `react-native-web` (confirmé en lisant son code source) : sans
    correctif, aucune erreur ni les deux choix multi-boutons de l'app
    (créer/rejoindre un compteur, confirmation de réinitialisation)
    n'auraient été visibles sur le web. `lib/alert.ts` (natif) /
    `lib/alert.web.ts` + `components/AlertHost.web.tsx` (web, modale
    thématisée) corrigent ce point pour tous les appels de l'app.
  - `expo-file-system` / `expo-sharing` ne sont pas disponibles sur le web :
    `lib/exportCsv.web.ts` déclenche un téléchargement classique
    (Blob + lien `<a download>`) à la place du partage natif.
  - `uploadEntryPhoto` (`lib/api.ts`) déduit maintenant le type/l'extension
    depuis le `Blob` lui-même plutôt que depuis l'URI locale — l'ancienne
    logique donnait un résultat invalide pour les URL `blob:` renvoyées par
    `expo-image-picker` sur le web (pas de point dans l'URI).
  - `expo-location`, `expo-audio`, `expo-image-picker` et
    `@react-native-async-storage/async-storage` ont déjà de vraies
    implémentations web (vérifié dans leurs sources : Geolocation API,
    `HTMLAudioElement`, `<input type=file>`, `localStorage`) : aucun
    changement requis.
- **Mise en page responsive** : `ScreenContainer` (utilisé par la plupart
  des écrans) et la barre d'onglets du compteur plafonnent maintenant la
  largeur du contenu à 480px, recentré — l'app reste lisible sur grand écran
  au lieu de s'étirer sur toute la largeur.
- **Déploiement continu** : `.github/workflows/deploy-web.yml` construit et
  publie automatiquement sur GitHub Pages à chaque push (voir `HANDOVER.md`
  pour les deux réglages ponctuels restant à faire côté GitHub, non
  accessibles depuis cette session).

### Validation effectuée pour cette version web

Cet environnement d'exécution **bloque au niveau réseau (politique
d'entreprise, 403) tout accès sortant vers `*.supabase.co`** depuis le
navigateur Playwright utilisé pour les tests — confirmé en isolant le
problème avec `curl` en direct. Il n'a donc pas été possible de dérouler ici
un parcours **authentifié** de bout en bout (inscription → connexion →
création de compteur → carte avec vraies données). Ce qui a en revanche été
vérifié réellement, par export du bundle web servi localement sous
`/Compteur/` (comme sur GitHub Pages) et piloté par Playwright/Chromium :

| Vérification | Résultat |
|---|---|
| Chargement de l'app (bundle 1.4 Mo + CSS Leaflet), aucune erreur console/requête échouée | ✅ |
| Écran de connexion, rendu visuel fidèle au thème | ✅ (capture d'écran) |
| Modale d'alerte web (`AlertHost`) sur une validation de formulaire côté client | ✅ (capture d'écran) |
| Mise en page responsive à 390px / 820px / 1440px de large (écran de connexion) | ✅ (captures d'écran) |
| Manifest, favicon, icônes (192/512/maskable), `sw.js` : chacun répond HTTP 200 sous `/Compteur/` | ✅ |
| Enregistrement effectif du service worker (scope `/Compteur/`, actif) | ✅ |
| `npm run typecheck` / `npm run lint` / `npm test` (38/38) / `expo export --platform web` et `--platform ios` | ✅ (à chaque étape) |

**Non vérifié ici** (nécessite un accès réseau complet à Supabase, absent de
ce bac à sable) : inscription/connexion réelles sur le web, création d'un
compteur avec écriture en base, affichage de vraies données sur la carte
Leaflet (tuiles OpenStreetMap incluses), export CSV avec téléchargement
réel, barre d'onglets du compteur (`CounterTabsNavigator`) en situation
authentifiée. Ces parcours utilisent du code déjà validé sur iPhone (section
0) ou des adaptations web au raisonnement simple et à faible risque (CSS
standard, wrappers directs d'API navigateur) ; ils restent à confirmer par
un test manuel une fois le site déployé sur GitHub Pages, ou en local dans

### Mise à jour — validé sur le site déployé (même jour)

Une fois `.github/workflows/deploy-web.yml` réellement exécuté (secrets
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` renseignés par
l'utilisateur, dépôt rendu public pour activer Pages), le déploiement réel a
révélé **deux bugs invisibles depuis ce bac à sable**, tous deux corrigés :

| Bug trouvé en déploiement réel | Cause | Corrigé par |
|---|---|---|
| Page blanche sur `https://samonnicolas-lab.github.io/Compteur/` | GitHub Pages traite le contenu avec Jekyll par défaut, qui ignore silencieusement les dossiers commençant par `_` — dont `_expo/`, où se trouve le bundle JS/CSS exporté. `index.html` se chargeait, mais jamais le script de l'app | Ajout de `public/.nojekyll` (copié tel quel dans l'export), qui désactive ce traitement |
| Après correction ci-dessus, écran blanc + `Uncaught Error: supabaseUrl is required` en console | Secret Actions mal orthographié (`EXPO_PUBLIC_SUPABASE_UR`, lettre finale manquante) : le build s'exécutait sans erreur (l'absence de ces variables ne fait qu'un avertissement console côté `lib/supabase.ts`), mais l'app plantait au démarrage faute d'URL Supabase valide | Secret renommé côté GitHub (suppression + recréation, le renommage direct n'étant pas possible) |

Le site déployé a ensuite été validé **avec un vrai compte** créé directement
depuis le web (inscription + connexion réussies) : la limitation décrite
juste au-dessus est donc levée — le parcours authentifié complet fonctionne
bien en production.
un environnement avec accès réseau complet.

## 0. Mise à jour du 06/09 — validation sur appareil réel

La version initiale de ce rapport (section 5) indiquait que rien n'avait pu être
testé sur un vrai appareil. C'est désormais fait : l'app a tourné sur un iPhone
réel (via Expo Go + GitHub Codespaces en tunnel) contre un vrai projet Supabase,
avec deux comptes distincts pour valider le parcours de groupe. Cette session de
test a révélé et corrigé **6 vrais bugs**, tous absents des vérifications
statiques (typecheck/lint/tests) puisqu'ils ne se manifestent qu'avec de vraies
policies Row Level Security évaluées par Postgres :

| Bug trouvé en test réel | Cause | Corrigé par |
|---|---|---|
| Emoji cassé/vide dans l'assistant de création | Découpage par point de code Unicode qui tronquait les emojis composés (ZWJ, teint) | Le champ transmet le texte tel quel (`components/EmojiInput.tsx`) |
| Recherche d'un groupe par code d'invitation impossible | Policy RLS `groups` : il fallait déjà être membre pour voir le groupe qu'on essaie de rejoindre (cercle vicieux) | Policy `select` élargie (`using (true)`) — le code lui-même sert de contrôle d'accès |
| Rejoindre un groupe échouait encore (`new row violates row-level security policy`) | Même cercle vicieux sur `group_members` : Postgres a besoin de visibilité SELECT pour évaluer la détection de conflit d'un upsert, or `is_member_of_group()` renvoie faux tant qu'on n'est pas déjà membre | Policy `select` sur `group_members` élargie de la même façon |
| Position GPS jamais enregistrée malgré une capture réussie côté app | Policy RLS `entries` : aucune policy `update` n'existait pour la mise à jour différée de lat/lng (l'update était silencieusement ignoré, 0 ligne, sans erreur) | Ajout de la policy `update` manquante |
| Son manqué un clic sur deux | `seekTo(0)` (asynchrone) n'était pas attendu avant `play()`, condition de course | `await` ajouté avant la lecture |
| L'Accueil affichait aussi les compteurs des coéquipiers | La policy RLS `counters` autorise volontairement à voir les compteurs du groupe (nécessaire aux classements), mais la requête de l'Accueil ne filtrait pas explicitement sur le propriétaire | Filtre `owner_id` ajouté côté requête |

Deux avertissements de type "horloge" (`JWT issued at future`) sont apparus à
plusieurs reprises pendant les tests — dus au fuseau horaire de l'appareil de
test, sans lien avec le code de l'app.

Amélioration ergonomique ajoutée suite aux retours de test : l'accueil propose
désormais explicitement **Créer** vs **Rejoindre un compteur** (au lieu de
découvrir l'option « rejoindre » au milieu de l'assistant de création), et le
parcours « rejoindre » pré-remplit nom/emoji/son à partir du compteur déjà
existant du groupe. Deux fonctionnalités demandées en cours de test ont aussi
été ajoutées : réinitialisation d'un compteur (avec confirmation) et liste
détaillée des clics par lieu sur la carte (avec miniatures photo).

Le détail complet de chaque correction est dans l'historique Git de la branche.

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

## 5. Validé sur appareil réel (voir section 0) / non testé restant

**Validé** le 06/09 sur un iPhone via Expo Go, contre un vrai projet Supabase, avec
deux comptes distincts : inscription/connexion, permissions natives (position,
photo), son au clic, création solo, création/adhésion de groupe par code
d'invitation, classements de groupe, export CSV, carte (clusters + miniatures
photo + liste des clics), réinitialisation d'un compteur.

**Non testé restant** :
- Android (uniquement iOS testé).
- Le rendu visuel final (couleurs, typographies exactes, motif capsule) n'a pas
  fait l'objet d'une revue design dédiée.
- Comportement à grande échelle (beaucoup d'entrées, beaucoup de membres) —
  voir la limitation « pas de pagination » dans `HANDOVER.md`.

Voir `HANDOVER.md` pour la marche à suivre et les limitations connues.
