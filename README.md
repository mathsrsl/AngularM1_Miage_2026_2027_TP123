# 🎸 Guitar Practice Cloud (GPC) — TP Angular & Node.js / Express

Projet réalisé dans le cadre du module **Programmation Web** - **Master 1 MIAGE (2026-2027)**.
_TP 1, 2 & 3_

---

**Auteur** : Mathieu Rossel

---

## 📖 Présentation du Projet

**Guitar Practice Cloud** est une application web permettant la gestion d'une bibliothèque personnelle de tracks audio :
- **Frontend** : Application développée avec **Angular 22**.
- **Backend** : API REST développée avec **Node.js**, **Express**, **MongoDB Atlas** (Mongoose), gestion de l'authentification par jeton **JWT**, et stockage des fichiers audio.

---

## 🚀 Synthèse des Travaux Réalisés (TP1, TP2, TP3)

L'ensemble des missions obligatoires des trois séances de TP a été intégralement implémenté, testé et documenté :

### TP 1 - Architecture & Authentification (Missions 0 & 1)
- **Mission 0 (Cartographie & flux)** : Analyse complète du backend et du frontend, rédaction du diagramme de séquence Mermaid documentant le cycle de vie de l'authentification et des requêtes protégées.
- **Mission 1 (Formulaires & Sécurité)** :
  - Formulaires réactifs (`ReactiveFormsModule`) avec validations strictes sur la connexion et l'inscription (email valide, mot de passe complexe, messages d'erreur ciblés).
  - Gestion de session réactive avec **Angular Signals** (`AuthService.token`, `AuthService.currentUser`) et vérification automatique de l'expiration du JWT (`exp`) au rechargement de la page.
  - Intercepteur HTTP fonctionnel (`authInterceptor`) injectant automatiquement `Authorization: Bearer <token>` sur les requêtes sortantes et gérant la déconnexion/redirection automatique en cas d'erreur 401.
  - Protection des routes sensibles (`/tracks`, `/profile`) via `authGuard`.
  - Modification du profil utilisateur avec notifications de succès/erreur et déconnexion dans la navbar.

### TP 2 - Pagination, Upload & Streaming Audio (Missions 2 & 3)
- **Mission 2 (Pagination)** :
  - Pagination côté client et serveur (`page`, `limit`), navigation précédente/suivante et affichage du total de pages.
  - Gestion fine des états de chargement (`loading`) et des erreurs réseau.
- **Mission 3 (Upload & Lecture audio Blob)** :
  - Validation frontend du fichier audio sélectionné (type MIME `audio/*` et taille maximale plafonnée à 25 Mo).
  - Upload asynchrone multipart via `FormData` avec réinitialisation complète du champ natif HTML (`#fileInput` / `@ViewChild`).
  - Lecture audio authentifiée via `HttpClient` avec `responseType: 'blob'` et création d'un `URL.createObjectURL(blob)`.
  - Gestion de la mémoire et prévention des fuites via révocation systématique des URLs (`URL.revokeObjectURL`) dans le hook `ngOnDestroy`.
  - Refonte graphique complète en grille responsive (`CSS Grid`), cohérente avec la charte graphique verte du projet, affichage de l'état de lecture active (`playingTrack`).

### TP 3 - Suppression, Progression d'Upload & Tests (Missions 5, 6 & 7)
- **Mission 5 (Suppression d'une piste)** :
  - Suppression sécurisée via `TrackService.delete(id)` (endpoint `DELETE /api/tracks/:id`).
  - Boîte de dialogue de confirmation native `confirm()` avant toute suppression.
  - Protection anti-double clic via le Signal `deletingId` désactivant le bouton pendant la requête.
  - Notification non bloquante avec **Angular Material** (`MatSnackBar`) pour les retours utilisateur (succès / échec).
  - Gestion du cas d'erreur 404 (piste déjà supprimée dans un autre onglet) avec rafraîchissement automatique de la liste.
  - Arrêt automatique du lecteur si la piste supprimée était en cours d'écoute.
- **Mission 6 (Suivi de progression d'upload en temps réel)** :
  - Activation de `withXhr()` dans `provideHttpClient` pour forcer l'usage de `XMLHttpRequest` (l'API `fetch` standard par défaut dans Angular 22 ne supporte pas `upload.onprogress`).
  - Capture des événements HTTP `HttpEventType.UploadProgress` et `HttpEventType.ResponseHeader` avec `{ reportProgress: true, observe: 'events' }`.
  - Calcul dynamique et sécurisé du pourcentage avec repli sur la taille réelle du fichier (`this.file.size`).
  - Rafraîchissement réactif du DOM via `ChangeDetectorRef.markForCheck()`.
  - Affichage d'une barre de progression `<progress>` et du pourcentage en direct, désactivation complète des champs pendant l'envoi.
- **Mission 7 (Tests automatisés frontend)** :
  - Configuration de l'environnement de test Vitest (`src/test-setup.ts`).
  - Écriture de 3 suites de tests unitaires (5 tests réussis) avec `provideHttpClientTesting()` et `HttpTestingController` :
    1. `AuthService.login()` : vérification de l'URL, de la méthode POST, du corps JSON et de la mise à jour des Signals.
    2. `TrackService.list()` & `delete()` : vérification des query params `page`/`limit` et de l'appel DELETE.
    3. `authInterceptor` : vérification de l'injection du header `Authorization` avec token, et vérification de son absence stricte sans token.

---

## Architecture du Projet

```text
AngularM1_Miage_2026_2027_TP123/
├── backend/                             # API REST Node.js / Express
│   ├── src/
│   │   ├── app.js                       # Serveur Express, routes, middlewares JWT et Multer
│   │   ├── models/                      # Schémas Mongoose (User, Track)
│   │   └── config/                      # Configuration MongoDB
│   └── package.json
│
├── frontend-starter/                    # Application Angular 22
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── app/                 # Shell applicatif (navigation, header, logout)
│   │   │   │   ├── login-page/          # Formulaire réactif de connexion
│   │   │   │   ├── register-page/       # Formulaire réactif d'inscription
│   │   │   │   ├── profile-page/        # Consultation et édition du profil utilisateur
│   │   │   │   └── tracks-page/         # Liste paginée, upload avec progression, lecteur, suppression
│   │   │   ├── shared/
│   │   │   │   ├── guards/              # authGuard (protection des routes)
│   │   │   │   ├── interceptors/        # authInterceptor (injection JWT & gestion 401)
│   │   │   │   ├── models/              # Interfaces TypeScript (User, Track, Page, AuthResponse)
│   │   │   │   └── services/            # AuthService & TrackService (appels HTTP)
│   │   │   └── routes.ts                # Configuration du routage Angular
│   │   ├── test-setup.ts                # Bootstrap de l'environnement de test Vitest
│   │   └── main.ts                      # Bootstrap Angular (provideHttpClient + withXhr)
│   ├── proxy.conf.json                  # Proxy de dev redirigeant /api vers le port 3000
│   └── package.json
│
├── docs/
│   └── images/                          # Captures d'écran des preuves d'exécution (livrables)
│       ├── screen_login_reseau_1.png
│       ├── screen_login_reseau_2.png
│       ├── screen_pagination_reseau.png
│       ├── screen_upload_reseau.png
│       ├── screen_lecture_authentifiee.png
│       ├── screen_suppression_reseau.png
│       └── screen_upload_progression.png
│
├── RAPPORT_IA_MODELE.md                 # Compte-rendu d'usage de l'IA & réponses livrables
└── README.md
```

---

## Prérequis

- **Node.js** : version 22.x ou supérieure recommandée
- **npm** : version 10.x ou supérieure
- **Compte MongoDB Atlas** (ou une instance locale de MongoDB)
- Un navigateur web moderne (Chrome, Firefox, Safari ou Edge)

---

## Installation & Démarrage

### 1. Configuration et lancement du Backend

1. Se placer dans le dossier backend et créer le fichier d'environnement `.env` à partir de l'exemple:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Renseigner les identifiants dans `.env` :
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/gpc?retryWrites=true&w=majority
   JWT_SECRET=votre_cle_secrete_jwt_robuste
   ```

4. Installer les dépendances et démarrer le serveur :
   ```bash
   npm install
   npm start
   ```
   Le serveur backend démarre et écoute sur `http://localhost:3000`.

---

### 2. Démarrage du Frontend Angular

Dans un **second terminal** :

1. Installer les dépendances :
   ```bash
   cd frontend-starter
   npm install
   ```

2. Lancer le serveur de développement Angular :
   ```bash
   npm start
   ```

4. Accessible sur **`http://localhost:4200`**.

> **Identifiants de démonstration prévus :**
> - **Email** : `demo@example.com`
> - **Mot de passe** : `Demo1234!`
> *(Il est également possible de créer un nouveau compte via la page d'inscription)*.

---

## Tests & Build

### Exécution des tests frontend (Mission 7)

Les tests unitaires ont été conçus avec **Vitest** et Angular TestBed pour s'exécuter en isolation complète, sans backend actif ni de base MongoDB :

```bash
cd frontend-starter
npm test
```

**3 fichiers, 5 tests :**
```text
 ✓ src/app/shared/services/track.service.spec.ts (2 tests)
 ✓ src/app/shared/services/auth.service.spec.ts (1 test)
 ✓ src/app/shared/interceptors/auth.interceptor.spec.ts (2 tests)
```

### Vérification de la compilation de production

```bash
cd frontend-starter
npm run build
```

---

## Livrables & Compte-Rendu IA

Le fichier [`RAPPORT_IA_MODELE.md`](RAPPORT_IA_MODELE.md) contient :
- Le détail étape par étape des interactions avec l'assistant IA pour chaque missions (TP1, TP2, TP3).
- Les questions de compréhension et d'architecture posées à l'IA.
- Les réponses aux questions théoriques des sujets de TP. (avec liens vers les captures d'écran de preuve dans `docs/images/`)
- Le tableau complet des tests unitaires (résultats attendus vs observés).
