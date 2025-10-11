<!-- Instructions concises pour agents IA — projet vitall-solution -->

# 🧠 Objectif

- Permettre à un agent IA (Copilot, GPT, etc.) d’être immédiatement opérationnel sur le projet Vitall.
- Comprendre la structure Next.js, les conventions UI, et **interpréter la maquette Figma connectée via MCP** pour générer automatiquement les composants React/Tailwind.

---

## 🧩 Contexte technique

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript + React 19
- **Style** : TailwindCSS
- **Design system** : issu de Figma (connecté via MCP)
- **Structure principale** :

src/

├── app/          # Routes & layouts

├── components/   # UI (design system)

├── modules/      # Logique métier (recruitment, etc.)

├── lib/          # Clients externes (API, Supabase, etc.)

└── types/        # Types partagés

```
```bash
npm install             # Installer les dépendances
npm run dev             # Lancer le serveur de dev
npm run build           # Compiler pour la production
npm run start           # Lancer le build compilé
npm run lint            # Vérifier la qualité du code
```

## 🔐 Variables d’environnement

Déclarées dans `.env` ou `.env.local`.

Avant toute exécution :

```bash
cp .env.example .env

```

## 🧱 Conventions de structure

| Domaine | Détails |
| --- | --- |
| **UI Components** | Chaque composant dans `src/components/ui/`, exporté via `index.ts`. |
| **Routing** | Pages et API via App Router : `page.tsx`, `layout.tsx`, `route.ts`. |
| **Modules métiers** | Isolés dans `src/modules/<nom>`. Ne pas mélanger avec l’UI. |
| **Librairies** | Clients externes dans `src/lib/` (Supabase, Figma SDK, etc.). |
| **Types globaux** | Dans `src/types/`. |
| **CSS global** | Défini dans `src/app/globals.css`. |

---

## 🎨 Intégration Figma (MCP)

### 🔗 Source connectée

Le projet est synchronisé avec Figma via MCP :

**`LEAN START UP — Maquette (Dev Mode)`**

→ [Ouvrir dans Figma](https://www.figma.com/design/2IATBRhB5vCiuCt7e6vU8k/LEAN-START-UP---Maquette?node-id=140-736&m=dev)

---

### 🧩 Règles d’interprétation pour l’agent

1. **Composants identifiés via MCP**
    - Extraire la structure (frames, calques, autolayouts, contraintes).
    - Générer un fichier React/Tailwind correspondant :
        
        `/src/components/ui/<NomDuComposant>.tsx`
        
2. **Design tokens**
    - Utiliser les tokens Tailwind ou CSS variables :
        - `bg-primary`, `bg-primary-dark`, `bg-primary-light`
        - `text-neutral-800`, `bg-neutral-100`
        - `bg-blue-900`, `text-error`, `bg-success`
    - ❌ Ne jamais injecter de valeurs hexadécimales directes.
3. **Typographie et couleurs**
    - Polices :
        - Texte : Inter / system-ui
        - Titres : Abadi MT Pro (chargée depuis `/public/fonts`)
    - Couleurs : synchronisées avec `tailwind.config.ts` et `globals.css`.
4. **Composants Figma détectés**
    - `Button`, `Input`, `Card`, `Sidebar`, `Header`, `LoginForm`, etc.
    - Créer un composant isolé pour chaque élément réutilisable.
    - S’appuyer sur les attributs de style (`fontSize`, `cornerRadius`, `fill`) pour mapper les classes Tailwind.

---

## 🧠 Logique d’analyse et de génération

L’agent doit :

1. **Analyser la structure Figma (via MCP)**
    - Identifier les *frames*, *groups*, *layers* et leurs noms.
    - Distinguer les composants atomiques (`Button`, `Input`, `Checkbox`) et les blocs composites (`LoginForm`, `RecruitmentCard`, etc.).
2. **Vérifier la disponibilité locale des composants**
    - Parcourir `src/components/ui/`.
    - Si le composant existe déjà → l’importer.
    - Si le composant n’existe pas → le générer proprement dans `src/components/ui/`.
    - Ajouter l’export correspondant dans `src/components/ui/index.ts`.
3. **Assembler la page**
    - Créer un fichier `src/app/<page>/page.tsx`.
    - Importer uniquement les composants nécessaires (pas de code inline).
    - Composer la structure JSX en suivant la hiérarchie Figma.
    - Utiliser les classes Tailwind et design tokens (`bg-primary`, `text-neutral-900`, etc.).
    - Respecter les contraintes de responsive visibles dans la maquette.
4. **Ne jamais créer de “composant fourre-tout”**
    - Interdiction de générer un fichier monolithique (ex: `LoginPage.tsx` contenant tous les sous-composants inline).
    - Les composants identifiés doivent toujours être séparés dans `/ui`.
    - Si une seule sous-partie manque (ex : `InputField`), la générer seule, puis l’importer proprement dans la page.

## 🧠 Exemples d’usage

### ➕ Générer un composant UI depuis la maquette

```
src/components/ui/Button.tsx

```

```tsx
import { Plus } from "lucide-react"

export default function Button({ label }: { label: string }) {
  return (
    <buttonclassName="
        inline-flex items-center justify-center gap-2
        px-6 py-2
        bg-primary hover:bg-primary-dark
        text-white font-semibold text-lg
        rounded-full transition-colors duration-200
      "
    >
      <Plus size={18} strokeWidth={3} />
      {label}
      <Plus size={18} strokeWidth={3} />
    </button>
  )
}

```

### ➕ Ajouter une route API

```
src/app/api/<endpoint>/route.ts

```

```tsx
export async function GET() {
  return Response.json({ status: "ok" })
}

```

## 🏷️ Conventions de nommage

| Type | Exemple | Règle |
| --- | --- | --- |
| **Atomique** | `ButtonPrimary`, `InputField`, `Checkbox` | PascalCase, nom clair et descriptif |
| **Composé** | `LoginForm`, `SidebarMenu`, `RecruitmentCard` | Nom + rôle |
| **Spécifique métier** | `CandidateTable`, `RecruitmentStatsCard` | Domaine + type |
| **Hook React** | `useRecruitmentData`, `useAuthSession` | camelCase, commence par `use` |
| **Exports** | via `src/components/ui/index.ts` | `export { default as ButtonPrimary } from "./ButtonPrimary"` |

✅ Dériver le nom à partir du calque Figma principal.

Exemples :

- `Frame/Button Primary` → `ButtonPrimary`
- `Group/Login Form` → `LoginForm`
- `Section/Recruitment Card` → `RecruitmentCard`

## 🎨 Design Tokens

Les couleurs Tailwind sont déjà définies dans `tailwind.config.ts` :

Utiliser uniquement ces classes :

- `bg-primary`, `bg-primary-dark`, `bg-primary-light`
- `text-neutral-900`, `bg-neutral-100`
- `text-error`, `bg-success`, `bg-blue-900`

❌ Jamais de code couleur hexadécimal inline.

---

## 🧩 Exemple de workflow correct

### 🪄 Cas : génération d’une page de connexion

1. Le LLM détecte dans Figma :
    - `Logo` (déjà présent)
    - `InputField` (absent)
    - `ButtonPrimary` (déjà présent)
    - `LoginForm` (composé des trois)
2. L’agent crée `src/components/ui/InputField.tsx` :
    
    ```tsx
    export default function InputField({ label, placeholder }: { label: string; placeholder: string }) {
      return (
        <label className="flex flex-col gap-1 text-neutral-900">
          {label}
          <inputplaceholder={placeholder}
            className="border border-neutral-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      )
    }
    
    ```
    
3. Il met à jour `index.ts` :
    
    ```tsx
    export { default as InputField } from "./InputField"
    
    ```
    
4. Puis il construit la page `src/app/login/page.tsx` :
    
    ```tsx
    import { InputField, ButtonPrimary } from "@/components/ui"
    import Image from "next/image"
    
    export default function LoginPage() {
      return (
        <main className="min-h-screen flex items-center justify-center bg-neutral-100">
          <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md">
            <div className="flex justify-center mb-8">
              <Image src="/logo.svg" alt="Vitall" width={120} height={40} />
            </div>
            <form className="flex flex-col gap-4">
              <InputField label="Identifiant" placeholder="Votre email" />
              <InputField label="Mot de passe" placeholder="••••••••" />
              <ButtonPrimary label="Connexion" />
            </form>
          </div>
        </main>
      )
    }
    
    ```
    

✅ Résultat : composants isolés, page propre, réutilisable, responsive.

---

## 📋 Checklist avant PR

1. Vérifier que **chaque composant est indépendant**.
2. Tous les composants sont exportés via `src/components/ui/index.ts`.
3. Aucun code UI inline dans les pages.
4. Lint et build passent :
    
    ```bash
    npm run lint && npm run build
    
    ```
    
5. PR claire : titre = “feat(login): création page + InputField”.

## ✅ Résumé final

L’agent IA doit être capable de :

- Lire la maquette Figma connectée via MCP.
- Identifier et nommer les composants.
- Vérifier leur existence locale.
- Créer uniquement les manquants.
- Assembler les pages avec les composants existants.
- Ne jamais générer de code monolithique.

<!-- Fin du fichier d’instructions -→