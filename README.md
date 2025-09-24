# 🚀 ModularSaaS - Next.js + Supabase Multi-Tenant Platform

Une plateforme SaaS modulaire prête pour la production, construite avec Next.js 14, Supabase et TypeScript. Architecture multi-tenant avec modules configurables activables/désactivables par organisation.

## ✨ Fonctionnalités

- **🏢 Architecture Multi-tenant** : Isolation complète des organisations avec Row Level Security (RLS)
- **🧩 Système Modulaire** : Activation/désactivation de modules par organisation (Recruitment, GED, Timesheets, Inventory, Accounting)
- **⚡ Stack Moderne** : Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **🔐 Authentification** : Supabase Auth avec contrôle d'accès basé sur les rôles
- **🗄️ Base de Données** : PostgreSQL avec politiques RLS avancées et audit logging
- **📁 Stockage Fichiers** : Gestion sécurisée des documents avec Supabase Storage
- **⚡ Temps Réel** : Mises à jour live avec Supabase Realtime
- **👨‍💼 Panel Admin** : Interface complète de gestion des modules et utilisateurs

## 📋 Modules Disponibles

### 🏗️ Système Central
- **Dashboard** : Vue d'ensemble avec statistiques et statut des modules
- **Panel Admin** : Gestion des modules, administration utilisateurs, logs d'audit
- **Authentification** : Accès basé sur les rôles (Owner, Admin, Member)

### 💼 Modules Métier
- **👥 Recruitment** : Gestion des candidats avec scoring automatique et suivi des entretiens
- **📄 GED (Gestion Électronique de Documents)** : Stockage sécurisé avec versioning et partage
- **⏰ Timesheets** : Suivi du temps avec gestion de projets et workflow d'approbation
- **📦 Inventory** : Gestion des stocks avec alertes de rupture et suivi des mouvements
- **💰 Accounting** : Gestion des factures avec suivi clients et traitement des paiements

## 🛠️ Stack Technologique

### Frontend
- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Développement type-safe
- **Tailwind CSS** : Framework CSS utility-first
- **shadcn/ui** : Composants UI beaux et accessibles
- **React Hook Form** : Gestion des formulaires avec validation Zod
- **TanStack Query** : Gestion d'état serveur

### Backend
- **Supabase** : Backend-as-a-Service avec PostgreSQL
- **Row Level Security** : Politiques de sécurité au niveau base de données
- **Supabase Auth** : Authentification basée JWT
- **Supabase Storage** : Stockage sécurisé de fichiers
- **Supabase Realtime** : Mises à jour de données en temps réel

### Architecture Services
- **API Routes** : API RESTful avec gestionnaires de routes Next.js
- **Couche Service** : Abstraction de la logique métier
- **Registry Modules** : Gestion dynamique des modules
- **Système d'Audit** : Logging complet des actions

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ et npm
- Compte Supabase
- Git

### 1. Configuration du Projet Supabase

1. Créez un nouveau projet sur [supabase.com](https://supabase.com)
2. Allez dans **Project Settings > API** et copiez :
   - URL du projet
   - Clé `anon`
   - Clé `service_role`

### 2. Configuration Base de Données

1. Allez dans **SQL Editor** de votre dashboard Supabase
2. Exécutez les fichiers de migration dans l'ordre :
   ```sql
   -- Copiez et collez le contenu de chaque fichier :
   -- 1. db/01_core.sql
   -- 2. db/02_recruitment.sql
   -- 3. db/03_ged.sql
   -- 4. db/04_timesheets.sql
   -- 5. db/05_inventory.sql
   -- 6. db/06_accounting.sql
   -- 7. db/07_seed.sql
   ```

### 3. Configuration Storage

1. Allez dans **Storage** du dashboard Supabase
2. Créez un nouveau bucket nommé `ged`
3. Configurez-le en **Private** (pas public)
4. Ajoutez cette politique RLS pour le bucket :

```sql
-- Permet aux utilisateurs de gérer les fichiers dans le dossier de leur organisation
CREATE POLICY "Users can manage org files" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'ged' AND auth.jwt() ->> 'organization_id' = (string_to_array(name, '/'))[2])
WITH CHECK (bucket_id = 'ged' AND auth.jwt() ->> 'organization_id' = (string_to_array(name, '/'))[2]);
```

### 4. Configuration Projet

1. **Clone et installation** :
   ```bash
   git clone <url-de-votre-repo>
   cd modular-saas
   npm install
   ```

2. **Configuration environnement** :
   ```bash
   cp .env.example .env.local
   ```

3. **Configurez `.env.local`** :
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=url_de_votre_projet
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
   SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
   ```

4. **Lancez le serveur de développement** :
   ```bash
   npm run dev
   ```

5. **Ouvrez [http://localhost:3000](http://localhost:3000)**

### 5. Créer un Utilisateur Démo

Les données de seed créent une organisation démo, mais vous devez créer un utilisateur :

1. **Inscrivez-vous** sur `/auth/signup` ou utilisez l'UI Auth de Supabase
2. **Mettez à jour les métadonnées utilisateur** dans le dashboard Supabase :
   - Allez dans **Authentication > Users**
   - Trouvez votre utilisateur et cliquez **Edit user**
   - Ajoutez dans **User Metadata** :
     ```json
     {
       "organization_id": "550e8400-e29b-41d4-a716-446655440000"
     }
     ```
3. **Créez le profil** dans la base de données :
   ```sql
   INSERT INTO profiles (id, organization_id, email, full_name, role)
   VALUES ('votre-id-utilisateur-auth', '550e8400-e29b-41d4-a716-446655440000', 'votre-email@example.com', 'Votre Nom', 'owner');
   ```

## 🎯 Identifiants Démo

Pour les tests, vous pouvez créer un utilisateur démo avec ces détails :
- **Email** : admin@acme-corp.com
- **Mot de passe** : demo123456
- **Organisation** : Acme Corp (pré-configurée avec des données d'exemple)

## 📁 Structure du Projet

```
app/                              # Next.js App Router
├── (dashboard)/                  # Routes dashboard protégées
│   ├── dashboard/               # Dashboard principal
│   ├── modules/                 # Pages spécifiques aux modules
│   └── admin/                   # Pages admin uniquement
├── api/                         # Routes API
│   ├── modules/                 # Gestion des modules
│   └── recruitment/             # API Recruitment
├── auth/                        # Pages d'authentification
│   ├── signin/                  # Page de connexion
│   └── signup/                  # Page d'inscription
└── globals.css                  # Styles globaux

components/                       # Composants React
├── ui/                          # Composants shadcn/ui
└── modules/                     # Composants spécifiques aux modules

lib/                             # Bibliothèques utilitaires
├── services/                    # Services de logique métier
├── types/                       # Définitions TypeScript
├── auth.ts                      # Utilitaires d'authentification
├── supabase.ts                  # Configuration client Supabase
└── module-registry.ts           # Gestion des modules

db/                              # Migrations base de données
├── 01_core.sql                  # Schéma multi-tenant central
├── 02_recruitment.sql           # Module Recruitment
├── 03_ged.sql                   # Module GED
├── 04_timesheets.sql            # Module Timesheets
├── 05_inventory.sql             # Module Inventory
├── 06_accounting.sql            # Module Accounting
└── 07_seed.sql                  # Données d'exemple
```

## 🔐 Fonctionnalités de Sécurité

### Row Level Security (RLS)
- **Isolation Organisation** : Toutes les données sont isolées par `organization_id`
- **Accès Basé sur les Rôles** : Les politiques appliquent les rôles et permissions utilisateur
- **Intégration JWT** : Utilise les claims JWT Supabase pour le contexte

### Authentification & Autorisation
- **Système Multi-rôles** : Hiérarchie Owner > Admin > Member
- **Permissions Niveau Module** : Contrôle d'accès par module activé
- **Gestion de Session** : Gestion sécurisée JWT avec middleware

### Protection des Données
- **Logging d'Audit** : Toutes les actions loggées avec contexte utilisateur
- **Validation d'Entrée** : Schémas Zod pour validation des requêtes API
**TRÈS IMPORTANT** : Ne jamais ignorer la configuration RLS pour aucune table. La sécurité n'est pas négociable !

## 🎛️ Système de Modules

### Concepts Centraux
- **Chargement Dynamique** : Les modules peuvent être activés/désactivés par organisation
- **Données Isolées** : Chaque module a ses propres tables de base de données avec RLS
- **Intégration Navigation** : Les éléments de menu se mettent à jour selon les modules activés
- **Architecture Service** : Séparation claire entre API, logique métier et données

### Ajouter de Nouveaux Modules

1. **Schéma Base de Données** : Créer une migration dans `db/`
2. **Couche Service** : Ajouter un service dans `lib/services/`
3. **Routes API** : Créer des routes dans `app/api/[module]/`
4. **Composants UI** : Construire des pages dans `app/(dashboard)/modules/[module]/`
5. **Enregistrer Module** : Ajouter à la table `core_module`

## 🔧 Développement

### Scripts Disponibles

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Construire pour la production
npm run start        # Démarrer le serveur de production
npm run lint         # Exécuter ESLint
```

### Organisation du Code

- **Services** : Logique métier abstraite des routes API
- **Types** : Définitions TypeScript centralisées
- **Composants** : Composants UI réutilisables avec props appropriées
- **Utilitaires** : Fonctions d'aide et configurations

### Bonnes Pratiques

- **Sécurité des Types** : Utilisation complète de TypeScript
- **Gestion d'Erreurs** : Limites d'erreur appropriées et feedback utilisateur
- **Performance** : Requêtes optimisées et rendu de composants
- **Accessibilité** : Labels ARIA et navigation clavier
- **Design Responsive** : Approche mobile-first

## 🚀 Déploiement

### Vercel (Recommandé)

1. **Connecter le Dépôt** : Importer votre repo GitHub vers Vercel
2. **Variables d'Environnement** : Ajouter vos identifiants Supabase
3. **Déployer** : Vercel construira et déploiera automatiquement

### Autres Plateformes

L'application fonctionne sur toute plateforme supportant Next.js :
- **Netlify** : Utiliser `npm run build` et déployer le répertoire `out/`
- **Railway** : Connecter le dépôt et ajouter les variables d'environnement
- **DigitalOcean App Platform** : Déployer directement depuis GitHub

### Variables d'Environnement

Le déploiement en production nécessite :
```bash
NEXT_PUBLIC_SUPABASE_URL=url_supabase_production
NEXT_PUBLIC_SUPABASE_ANON_KEY=cle_anon_production
SUPABASE_SERVICE_ROLE_KEY=cle_service_role_production
```

## 📚 Documentation API

### Authentication
Toutes les routes API nécessitent une authentification. Inclure le token JWT dans les requêtes :
```javascript
headers: {
  'Authorization': 'Bearer <jwt-token>'
}
```

### Gestion des Modules
```
GET /api/modules              # Obtenir tous les modules avec statut
POST /api/modules             # Basculer module pour organisation
```

### Module Recruitment
```
GET /api/recruitment/candidates     # Lister les candidats
POST /api/recruitment/candidates    # Créer un candidat
GET /api/recruitment/candidates/:id # Obtenir un candidat
PUT /api/recruitment/candidates/:id # Mettre à jour un candidat
DELETE /api/recruitment/candidates/:id # Supprimer un candidat
GET /api/recruitment/stats          # Obtenir les statistiques de recrutement
```

Des modèles similaires existent pour tous les modules avec opérations CRUD complètes.

## 🤝 Contribution

1. **Fork le dépôt**
2. **Créer une branche feature** : `git checkout -b feature/fonctionnalite-geniale`
3. **Commit les changements** : `git commit -m 'Ajouter fonctionnalité géniale'`
4. **Push vers la branche** : `git push origin feature/fonctionnalite-geniale`
5. **Ouvrir une Pull Request**

### Directives de Développement

- Suivre les bonnes pratiques TypeScript
- Ajouter une gestion d'erreur appropriée
- Inclure la documentation API
- Écrire des messages de commit significatifs
- Tester minutieusement avant soumission

## 🐛 Dépannage

### Problèmes Courants

**Problèmes d'Authentification** :
- Vérifier les identifiants Supabase dans `.env.local`
- Vérifier que l'utilisateur a `organization_id` dans les métadonnées
- S'assurer que le profil existe dans la table `profiles`

**Erreurs de Base de Données** :
- Confirmer que toutes les migrations ont été exécutées avec succès
- Vérifier que les politiques RLS sont appliquées correctement
- Vérifier que l'utilisateur a un accès approprié à l'organisation

**Module Non Affiché** :
- Vérifier que le module est activé dans la base de données
- Vérifier que l'utilisateur a les permissions requises
- Vider le cache du navigateur et redémarrer le serveur de dev

**Problèmes de Stockage** :
- Confirmer que le bucket GED existe et est privé
- Vérifier les politiques RLS sur storage.objects
- Vérifier que les chemins de fichiers suivent la structure d'organisation

### Obtenir de l'Aide

- **GitHub Issues** : Signaler des bugs et demandes de fonctionnalités
- **Discussions** : Poser des questions et partager des idées
- **Documentation** : Consulter ce README et les commentaires inline

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour les détails.

## 🙏 Remerciements

- **Supabase** : Plateforme backend-as-a-service incroyable
- **Vercel** : Déploiement Next.js sans couture
- **shadcn/ui** : Magnifique bibliothèque de composants UI
- **Tailwind CSS** : Framework CSS utility-first

---

**Construit avec ❤️ pour les applications SaaS modernes**

## 🎯 Points Clés de l'Architecture

### ✅ Structure Corrigée
- **UN SEUL dossier `app/`** à la racine (fini la confusion !)
- **Architecture Next.js 14 App Router** propre et cohérente
- **Séparation claire** : `app/` pour les routes, `lib/` pour la logique, `components/` pour l'UI

### 🔥 Fonctionnalités Prêtes
- **Multi-tenant complet** avec RLS Supabase
- **5 modules métier** : Recruitment, GED, Timesheets, Inventory, Accounting
- **Dashboard admin** pour gérer les modules
- **Authentification robuste** avec rôles et permissions
- **API REST complète** avec validation Zod

### 🚀 Démarrage en 15 Minutes
1. Cloner le repo
2. Configurer Supabase (URL + clés)
3. Exécuter les migrations SQL
4. Créer le bucket storage
5. `npm install && npm run dev`

**Le projet est maintenant 100% fonctionnel avec une structure Next.js correcte !** 🎉