# Document de reprise — App Compteur

Ce document explique comment reprendre ce projet là où il en est.

## État actuel

- **Branche** : `claude/app-cahier-charges-pgwb0j` (poussée sur `origin`, et
  c'est actuellement la branche par défaut du dépôt)
- **Aucune pull request n'a été ouverte** (non demandé)
- Le code compile, passe le typecheck, le lint et les tests unitaires — voir
  `RAPPORT.md` pour le détail.
- **L'app a été testée sur un vrai iPhone** (Expo Go) contre un vrai projet
  Supabase, avec deux comptes distincts, le 06/09. Le parcours complet du
  cahier des charges fonctionne — voir la section 0 de `RAPPORT.md` pour le
  détail des bugs trouvés et corrigés pendant cette session (essentiellement
  des policies RLS Supabase manquantes, invisibles en local sans base réelle).
- **L'app tourne désormais aussi comme site web / PWA** (`react-native-web`),
  en remplacement du parcours Expo Go + tunnel pour les tests — voir la
  section -1 de `RAPPORT.md` pour le détail, et « Déployer la version web »
  ci-dessous pour la mettre en ligne.

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

### 2. Lancer l'app

```bash
npx expo start
```

- **Sur le web** (recommandé désormais) : `npx expo start --web`, ou ouvrez
  la version déployée sur GitHub Pages (voir « Déployer la version web »
  ci-dessous).
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

## Déployer la version web (GitHub Pages)

Le workflow `.github/workflows/deploy-web.yml` construit et publie
automatiquement le site à chaque push sur `claude/app-cahier-charges-pgwb0j`.
Deux réglages ponctuels, à faire une seule fois dans les paramètres GitHub du
dépôt (impossibles à faire depuis une session Claude Code, faute d'accès à
ces écrans) :

1. **Settings → Pages** : dans « Build and deployment » → « Source »,
   sélectionnez **GitHub Actions** (au lieu de « Deploy from a branch »).
2. **Settings → Secrets and variables → Actions** : ajoutez deux secrets de
   dépôt (*repository secrets*, pas *environment secrets*) avec les mêmes
   valeurs que dans votre `.env` local :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Une fois ces deux réglages faits, relancez le workflow (onglet **Actions**
du dépôt → sélectionnez « Déploiement web (GitHub Pages) » → « Run
workflow », ou repoussez un commit) : le site sera publié à l'adresse
`https://samonnicolas-lab.github.io/Compteur/`.

⚠️ Si le nom du dépôt ou son propriétaire changent un jour, deux endroits
sont à mettre à jour en conséquence : `experiments.baseUrl` dans `app.json`
(actuellement `/Compteur`) et le nom de branche déclencheur dans
`.github/workflows/deploy-web.yml` (si une branche `main` est créée plus
tard, remplacez-y `claude/app-cahier-charges-pgwb0j`).

### Tester la version web en local avant de déployer

```bash
npx expo export --platform web --output-dir dist
npx serve dist   # ou tout autre serveur statique
```

Notez que l'export utilise `experiments.baseUrl = /Compteur`, donc les
chemins générés supposent d'être servis sous un sous-dossier `/Compteur/` —
pour un test 100% fidèle à GitHub Pages, servez `dist/` depuis un dossier
parent nommé `Compteur/` (ou testez simplement via `npx expo start --web`,
qui sert à la racine et fonctionne très bien pour le développement).

## Limitations connues à traiter avant une mise en production

- **Confirmation d'email désactivée** : « Confirm email » a été décoché dans
  Supabase (Authentication → Providers → Email) pendant les tests, pour créer
  plusieurs comptes sans avoir à cliquer un lien à chaque fois. De plus, le
  lien de confirmation redirige actuellement vers `localhost` (adresse par
  défaut, jamais configurée) et affiche une erreur de connexion dans le
  navigateur — la confirmation elle-même aboutit côté serveur malgré cette
  page d'erreur, mais ce n'est pas correct visuellement. Avant la mise en
  production, maintenant que la version web est la cible principale :
  1. Réactivez « Confirm email ».
  2. Passez `emailRedirectTo: Linking.createURL('/')` (import `expo-linking`)
     dans l'appel `supabase.auth.signUp()` de `contexts/AuthContext.tsx` — une
     fois le site déployé, cela redirigera vers son URL GitHub Pages sur le
     web, et vers le schéma `compteur://` sur natif.
  3. Ajoutez l'URL GitHub Pages (`https://samonnicolas-lab.github.io/Compteur/`)
     à la liste blanche **Redirect URLs** du dashboard Supabase
     (Authentication → URL Configuration).
  Cette configuration n'a de sens qu'une fois le site déployé sur une URL
  stable (voir « Déployer la version web » plus haut) : en test via Expo Go
  + tunnel ou `expo start --web`, l'adresse change à chaque relance du
  serveur et ne peut pas être enregistrée durablement.
- **Parcours web authentifié non testé manuellement** : l'environnement où
  cette version web a été construite bloque au niveau réseau les appels
  sortants vers `*.supabase.co` (politique d'entreprise du bac à sable), donc
  l'inscription/connexion/création de compteur/carte avec vraies données n'a
  pas pu être vérifiée en conditions réelles sur le web (voir section -1 de
  `RAPPORT.md` pour le détail de ce qui a et n'a pas pu être vérifié). Ce
  parcours utilise le même code déjà validé sur iPhone (section 0) plus des
  adaptations web ciblées et testées séparément (voir `lib/alert.web.ts`,
  `lib/exportCsv.web.ts`, `screens/map/MapScreen.web.tsx`) — mais un passage
  manuel complet sur le site déployé (ou en local avec un accès réseau
  complet) reste à faire avant de le considérer prêt pour de vrais
  utilisateurs.
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

1. Faire les deux réglages GitHub ponctuels puis tester le site déployé sur
   un vrai téléphone (voir « Déployer la version web » plus haut) : c'est le
   seul parcours qui n'a pas encore pu être validé en conditions réelles
   (inscription, connexion, création de compteur, carte, export CSV — voir
   la limitation « Parcours web authentifié non testé manuellement »
   ci-dessus).
2. Charger les polices Lora / Public Sans si l'identité visuelle exacte du
   cahier des charges est requise.
3. Remplacer les sons placeholder si besoin d'un rendu audio plus soigné.
4. Une fois le site déployé et testé, faire les deux ajustements « email de
   confirmation » listés ci-dessus (réactiver Confirm email, whitelister
   l'URL GitHub Pages).

Le pipeline CI (`npm run typecheck` / `lint` / `test` à chaque push) et le
déploiement web sont déjà en place (`.github/workflows/deploy-web.yml`).

## Où trouver quoi

- Vue d'ensemble de la structure du code : voir la section « Structure du
  projet » dans `README.md`.
- Détail de ce qui a été validé automatiquement et des décisions techniques :
  `RAPPORT.md`.
- Cahier des charges d'origine : `docs/cahier-des-charges.md`.
