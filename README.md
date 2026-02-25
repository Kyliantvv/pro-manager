# ProManager — Application de Gestion de Projets Collaborative

Une application fullstack de gestion de projets inspirée de Trello/Jira, construite avec **Symfony** (API REST) et **React + Vite** (frontend).

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Schéma de base de données](#schéma-de-base-de-données)
- [Endpoints API](#endpoints-api)
- [Installation](#installation)
  - [Prérequis](#prérequis)
  - [Configuration du backend](#configuration-du-backend)
  - [Configuration du frontend](#configuration-du-frontend)
- [Variables d'environnement](#variables-denvironnement)
- [Lancer l'application](#lancer-lapplication)
- [Fonctionnalités](#fonctionnalités)

---

## Vue d'ensemble

ProManager est un outil collaboratif de gestion de projets qui permet aux équipes de :

- Créer et gérer des **projets** avec priorités, statuts, couleurs et dates d'échéance
- Organiser le travail avec un **tableau Kanban** (À faire → En cours → En révision → Terminé)
- Collaborer en ajoutant des **membres d'équipe** aux projets
- Suivre la progression avec des **barres de complétion** et statistiques de tâches
- S'authentifier de manière sécurisée avec des **tokens JWT**

---

## Architecture

```
prjetfullstack/
├── backend/          ← API REST Symfony 6.4 (PHP 8.2+)
└── frontend/         ← SPA React 18 + Vite (Node 18+)
```

L'architecture est **strictement séparée** :
- Le backend expose une **API REST pure** (JSON uniquement, sans Twig/HTML)
- Le frontend communique exclusivement via des **requêtes HTTP avec JWT**
- Aucune authentification par session ou cookie — **JWT stateless** partout

---

## Stack technique

### Backend
| Technologie | Rôle |
|---|---|
| Symfony 6.4 LTS | Framework PHP (architecture MVC) |
| Doctrine ORM | Abstraction BDD & migrations |
| SQLite | Base de données relationnelle |
| LexikJWTAuthenticationBundle | Authentification JWT |
| NelmioApiDocBundle | Documentation Swagger/OpenAPI |
| NelmioCorsBundle | Partage de ressources cross-origin (CORS) |
| Symfony Validator | Validation des données |

### Frontend
| Technologie | Rôle |
|---|---|
| React 18 | Bibliothèque UI |
| Vite 5 | Outil de build & serveur de développement |
| React Router 6 | Routage côté client |
| Axios | Client HTTP |
| Tailwind CSS 3 | Styles utilitaires |
| Google Fonts (Syne + DM Sans) | Typographie |

---

## Structure du projet

### Backend (`/backend`)

```
backend/
├── config/
│   ├── packages/
│   │   ├── doctrine.yaml               # Configuration ORM
│   │   ├── doctrine_migrations.yaml    # Chemin des migrations
│   │   ├── framework.yaml              # Paramètres du framework
│   │   ├── lexik_jwt_authentication.yaml  # Config JWT
│   │   ├── nelmio_api_doc.yaml         # Config Swagger
│   │   ├── nelmio_cors.yaml            # Config CORS
│   │   ├── security.yaml               # Firewalls & contrôle d'accès
│   │   └── validator.yaml
│   ├── routes/
│   │   └── nelmio_api_doc.yaml         # Routes de l'UI Swagger
│   ├── bundles.php                     # Bundles enregistrés
│   ├── routes.yaml                     # Routes principales (par attributs)
│   └── services.yaml                   # Conteneur DI
├── migrations/
│   └── Version20240101000000.php       # Migration du schéma initial
├── public/
│   └── index.php                       # Contrôleur frontal
├── src/
│   ├── Controller/
│   │   ├── AuthController.php          # /api/auth/* (register, login, me)
│   │   ├── ProjectController.php       # /api/projects/* (CRUD + membres)
│   │   ├── TaskController.php          # /api/projects/{id}/tasks, /api/tasks/*
│   │   └── UserController.php          # /api/users/* (profil, recherche)
│   ├── Entity/
│   │   ├── User.php                    # Entité User (UserInterface)
│   │   ├── Project.php                 # Entité Project
│   │   └── Task.php                    # Entité Task
│   ├── EventListener/
│   │   └── JWTCreatedListener.php      # Enrichit le payload JWT
│   ├── Repository/
│   │   ├── UserRepository.php          # Requêtes User (recherche)
│   │   ├── ProjectRepository.php       # Requêtes Project (filtrage/pagination)
│   │   └── TaskRepository.php          # Requêtes Task (kanban/filtrage/pagination)
│   └── Kernel.php
├── .env                                # Variables d'environnement (hors git)
├── .env.example                        # Modèle pour les variables d'env
└── composer.json
```

### Frontend (`/frontend`)

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.jsx              # Conteneur de mise en page racine
│   │   │   ├── Navbar.jsx              # Barre supérieure (thème, avatar)
│   │   │   └── Sidebar.jsx             # Sidebar de navigation
│   │   ├── Project/
│   │   │   ├── ProjectCard.jsx         # Carte de résumé de projet
│   │   │   └── ProjectForm.jsx         # Formulaire création/édition projet
│   │   ├── Task/
│   │   │   ├── KanbanBoard.jsx         # Conteneur du tableau Kanban
│   │   │   ├── KanbanColumn.jsx        # Colonne glisser-déposer
│   │   │   ├── TaskCard.jsx            # Carte de tâche individuelle
│   │   │   └── TaskForm.jsx            # Formulaire création/édition tâche
│   │   ├── UI/
│   │   │   ├── Badge.jsx               # PriorityBadge, StatusBadge
│   │   │   ├── Button.jsx              # Bouton réutilisable (variantes + chargement)
│   │   │   ├── Modal.jsx               # Dialogue modal accessible
│   │   │   └── Skeleton.jsx            # Squelettes de chargement
│   │   └── ProtectedRoute.jsx          # Garde d'authentification pour les routes
│   ├── contexts/
│   │   ├── AuthContext.jsx             # Gestion de l'état JWT
│   │   └── ThemeContext.jsx            # État du mode sombre/clair
│   ├── pages/
│   │   ├── LoginPage.jsx               # /login
│   │   ├── RegisterPage.jsx            # /register
│   │   ├── DashboardPage.jsx           # /dashboard (liste projets + stats)
│   │   ├── ProjectPage.jsx             # /projects/:id (tableau kanban)
│   │   └── ProfilePage.jsx             # /profile (paramètres utilisateur)
│   ├── services/
│   │   └── api.js                      # Instance Axios + helpers API
│   ├── App.jsx                         # Configuration du routeur
│   ├── main.jsx                        # Point d'entrée React
│   └── index.css                       # Base Tailwind + styles personnalisés
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── .env.example
```

---

## Schéma de base de données

### Entités & Relations

```
User ──────────────────────── Project
 │  (propriétaire) 1 ─── * (projets possédés)
 │  (membre) * ──────── * (projets rejoints) via pivot project_member
 │  (assigné) 1 ──────── * (tâches assignées)
 │  (créateur) 1 ─────── * (tâches créées)
 └─────────────────────────── Task

Project ──── * Tasks (OneToMany, suppression en cascade)
```

### Champs principaux

**User** : `id`, `email` (unique), `password` (bcrypt), `firstName`, `lastName`, `avatar`, `bio`, `roles`, `createdAt`, `updatedAt`

**Project** : `id`, `name`, `description`, `status` (planning/active/on_hold/completed/archived), `priority` (low/medium/high), `color` (hex), `dueDate`, `createdAt`, `updatedAt`, `owner_id`

**Task** : `id`, `title`, `description`, `status` (todo/in_progress/review/done), `priority` (low/medium/high/urgent), `position` (ordre kanban), `dueDate`, `estimatedHours`, `createdAt`, `updatedAt`, `project_id`, `assignee_id`, `creator_id`

---

## Endpoints API

Tous les endpoints sauf `/api/auth/login` et `/api/auth/register` requièrent `Authorization: Bearer <token>`.

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Obtenir un token JWT |
| `GET`  | `/api/auth/me` | Récupérer l'utilisateur courant |

### Projets
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`  | `/api/projects` | Lister les projets (paginé, filtrable) |
| `POST` | `/api/projects` | Créer un projet |
| `GET`  | `/api/projects/{id}` | Détails d'un projet |
| `PUT`  | `/api/projects/{id}` | Modifier un projet (propriétaire uniquement) |
| `DELETE` | `/api/projects/{id}` | Supprimer un projet (propriétaire uniquement) |
| `POST` | `/api/projects/{id}/members` | Ajouter un membre par email |
| `DELETE` | `/api/projects/{id}/members/{memberId}` | Retirer un membre |

**Paramètres de requête pour `GET /api/projects` :**
- `page`, `limit` — pagination
- `status`, `priority` — filtrage
- `search` — recherche par nom/description
- `sort` (createdAt/name/dueDate/priority), `order` (ASC/DESC)

### Tâches
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`  | `/api/projects/{id}/tasks` | Lister les tâches (paginé, filtrable) |
| `GET`  | `/api/projects/{id}/tasks/kanban` | Tableau kanban (groupé par statut) |
| `POST` | `/api/projects/{id}/tasks` | Créer une tâche |
| `GET`  | `/api/tasks/{id}` | Détails d'une tâche |
| `PUT`  | `/api/tasks/{id}` | Modifier une tâche |
| `PATCH` | `/api/tasks/{id}/status` | Déplacer une tâche (glisser-déposer) |
| `DELETE` | `/api/tasks/{id}` | Supprimer une tâche |

### Utilisateurs
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET`  | `/api/users/me` | Récupérer son propre profil |
| `PUT`  | `/api/users/me` | Modifier le profil / changer le mot de passe |
| `GET`  | `/api/users/search?q=` | Rechercher des utilisateurs par nom/email |

**Interface Swagger** disponible sur : `http://localhost:8000/api/doc`

---

## Installation

### Prérequis

- PHP 8.2+
- Composer 2+
- SQLite (inclus nativement dans PHP avec les extensions `pdo_sqlite` et `sqlite3`)
- Node.js 18+ et npm
- OpenSSL (pour la génération des clés JWT)
- Symfony CLI (optionnel mais recommandé)

---

### Configuration du backend

**1. Installer les dépendances**

```bash
cd backend
composer install
```

**2. Configurer l'environnement**

```bash
cp .env.example .env
```

Éditer `.env` :
```env
APP_SECRET=votre_secret_32_caracteres
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
JWT_PASSPHRASE=votre_passphrase_jwt_securisee
```

**3. Créer le schéma de base de données**

```bash
php bin/console doctrine:schema:create
```

**4. Générer les clés JWT**

```bash
mkdir -p config/jwt
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout
```

> Utilisez la même passphrase que celle définie dans `JWT_PASSPHRASE`.

---

### Configuration du frontend

**1. Installer les dépendances**

```bash
cd frontend
npm install
```

**2. Configurer l'environnement (optionnel)**

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8000
```

> Si vous utilisez le proxy Vite (par défaut), cette variable peut être omise. Le proxy redirige `/api` vers `http://localhost:8000`.

---

## Variables d'environnement

### Backend (`.env`)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `APP_ENV` | Environnement applicatif | `dev` / `prod` |
| `APP_SECRET` | Secret aléatoire de 32 caractères | `a1b2c3...` |
| `DATABASE_URL` | DSN de connexion Doctrine | `sqlite:///%kernel.project_dir%/var/data.db` |
| `JWT_SECRET_KEY` | Chemin vers la clé PEM privée | `%kernel.project_dir%/config/jwt/private.pem` |
| `JWT_PUBLIC_KEY` | Chemin vers la clé PEM publique | `%kernel.project_dir%/config/jwt/public.pem` |
| `JWT_PASSPHRASE` | Passphrase pour la clé privée | `votre_passphrase_securisee` |
| `JWT_TOKEN_TTL` | Durée de vie du token en secondes | `3600` (1 heure) |
| `CORS_ALLOW_ORIGIN` | Regex d'origine CORS autorisée | `'^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$'` |

### Frontend (`.env`)

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL de base de l'API backend | `http://localhost:8000` |

---

## Lancer l'application

### Développement

**Backend** (au choix) :
```bash
# Option A : Symfony CLI (recommandé)
cd backend
symfony server:start

# Option B : Serveur intégré PHP
cd backend
php -S localhost:8000 -t public/
```

**Frontend :**
```bash
cd frontend
npm run dev
```

L'application sera disponible sur :
- Frontend : `http://localhost:3000`
- API Backend : `http://localhost:8000`
- Swagger UI : `http://localhost:8000/api/doc`

### Production

**Backend :**
```bash
cd backend
APP_ENV=prod composer install --no-dev --optimize-autoloader
APP_ENV=prod php bin/console cache:clear
# Configurer un vrai serveur web (Nginx/Apache) pointant vers /public
```

**Frontend :**
```bash
cd frontend
npm run build
# Servir le dossier /dist avec n'importe quel serveur de fichiers statiques
```

---

## Fonctionnalités

### Backend
- **API REST pure** — sans Twig, sans rendu côté serveur
- **Authentification JWT** — stateless, token enrichi avec les données utilisateur via un event listener
- **3 Entités** — User, Project, Task avec relations appropriées (OneToMany, ManyToMany)
- **CRUD complet** — Projets (avec gestion des membres) et Tâches
- **Logique métier** — contrôle d'accès (propriétaire vs membre), détection des retards, pourcentage de complétion, suivi de position pour le kanban
- **Validation avancée** — Symfony Validator avec règles personnalisées sur toutes les entités
- **Pagination** — sur les listes de projets et de tâches
- **Filtrage** — par statut, priorité, assigné, terme de recherche
- **Tri** — colonne et direction configurables
- **Swagger/OpenAPI** — documentation API interactive auto-générée sur `/api/doc`
- **CORS** — configuré pour le développement local

### Frontend
- **Routes protégées** — garde JWT redirige vers la connexion
- **Mode sombre** — détection de la préférence système + bascule manuelle, persistée dans localStorage
- **Design responsive** — adapté mobile avec sidebar coulissante
- **Tableau Kanban** — glisser-déposer HTML5 entre colonnes, mises à jour UI optimistes
- **Squelettes de chargement** — placeholders shimmer pendant la récupération des données
- **Formulaires** — entrées contrôlées avec validation côté client et affichage des erreurs serveur
- **Gestion des tokens** — attachés automatiquement aux requêtes, redirection sur 401
- **Système de design** — polices Syne + DM Sans, accents indigo/violet, cartes glassmorphism, animations fluides

---

## Licence

MIT — libre d'utilisation pour l'apprentissage et l'évaluation.
