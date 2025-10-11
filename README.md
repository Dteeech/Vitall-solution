# Intervention Modules

**Plateforme modulaire pour les services institutionnels**

*(Pompiers, Police, Hôpitaux, etc.)*

> Projet de développement d’une suite d’applications modulaires destinée aux services d’intervention.
> 
> 
> Premier module développé : **Recrutement des pompiers volontaires**.
> 

---

## Objectifs

Ce projet vise à créer une architecture **modulaire, scalable et réutilisable** pour différents services publics, en commençant par le **recrutement des pompiers volontaires**.

Chaque module est **indépendant mais interconnecté** (authentification commune, base de données unifiée, design system partagé).

### Modules prévus

- **Recrutement** — gestion des candidatures, entretiens et statuts
- **Ressources humaines** — profils, affectations, formations
- **Intervention** — planification et suivi des missions
- **Administration** — gestion interne, statistiques et documents

---

## Stack technique

| Domaine | Technologie |
| --- | --- |
| **Framework** | [Next.js 15](https://nextjs.org/) |
| **Langage** | TypeScript |
| **Style** | TailwindCSS + Design system Figma |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Auth & Backend** | à définir (Supabase, PostgreSQL ou API custom) |
| **Déploiement** | VPS ou [Vercel](https://vercel.com/) |
| **IA Agents** | (à venir) pour génération de code et automatisation |

---

## Structure du projet

intervention-modules/

├── src/

│   ├── app/                # Routes Next.js (App Router)

│   ├── components/         # UI et Design System

│   ├── modules/

│   │   └── recruitment/    # Module Recrutement pompier volontaire

│   ├── lib/                # Clients / outils (supabase, api, etc.)

│   └── types/              # Types TS globaux

├── public/                 # Assets

├── .env.example

├── package.json

├── tsconfig.json

├── tailwind.config.ts

└── README.md

Clone le dépôt :

```bash
git clone <https://github.com/><ton-user>/intervention-modules.git
cd intervention-modules
```

Installe les dépendances :

```bash
npm install

```

### Configuration des variables d’environnement

Copie le modèle `.env.example` vers `.env` :

```bash
cp .env.example .env

```

**Ne jamais commit le fichier `.env`**

Ce fichier contient des informations sensibles (tokens, clés API).

Remplis les valeurs selon ton environnement :

```bash
FIGMA_TOKEN=your_figma_token_here
FIGMA_FILE_KEY=your_figma_file_key_here
OPENAI_API_KEY=placeholder_key
FIGMA_URL=https://www.figma.com/file/<your_file_key>
```

---

### Lancer le projet localement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000/)

---

## Module actuel : Recrutement pompier volontaire

### Objectif

Permettre à une personne de :

- Créer un compte volontaire
- Remplir un dossier de candidature
- Suivre son statut (en attente, entretien, accepté, rejeté)
- Échanger avec les responsables du centre

### Fonctionnalités prévues

- Formulaire dynamique basé sur la maquette Figma
- Authentification (NextAuth ou Supabase)
- Espace admin (validation, filtres, exports)
- Gestion et tri des candidatures

---

## Design & UI

- Prendre la **maquette Figma** fournie
- Identifier les composants et les intégrer avec **Copilot** (ou un agent IA futur)
- Framework utilisé : **Next.js + TailwindCSS + shadcn/ui**
- Respecter la structure standardisée dans `@/components/ui/`

---

## Workflow de production

1. **Prendre la maquette** depuis Figma
2. **Extraire les composants UI** (manuellement ou via Copilot)
3. **Coder le module** en Next.js + Tailwind
4. **Connecter la base de données** (Supabase à valider)
5. **Tester localement**, commit et push sur GitHub

---

## Scripts utiles

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile le projet pour la production |
| `npm run lint` | Vérifie la qualité du code |
| `npm run start` | Démarre l’app compilée |

---

## Bonnes pratiques

- Ne jamais committer le fichier `.env`
- Exécuter `npm run lint` avant chaque commit
- Organiser le code en modules (`/modules/`)
- Documenter les PR et commits clairement
- Centraliser les composants dans `@/components/ui/`

---

*M2 Chef de Projet Digital — Option Fullstack*

Démarré en **2025**

---

## Licence

Projet à usage académique et interne.