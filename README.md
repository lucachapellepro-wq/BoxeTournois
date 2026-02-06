# 🥊 TOURNOI BOXE — Guide d'installation pas à pas

Application de gestion de tournoi de boxe avec inscription des boxeurs,
catégorisation automatique par poids et âge, gestion des clubs.

---

## Versions utilisées (février 2026)

| Outil       | Version     | Rôle                          |
|-------------|-------------|-------------------------------|
| Node.js     | 24.x LTS    | Moteur JavaScript             |
| Next.js     | 16.1.x      | Framework web (React)         |
| React       | 19.2.x      | Interface utilisateur         |
| Prisma      | 7.2.x       | Gestion base de données       |
| TypeScript  | 5.8.x       | Typage du code                |
| SQLite      | intégré      | Base de données (fichier local) |

---

## ÉTAPE 1 — Installer Node.js sur ton PC

### Windows
1. Va sur **https://nodejs.org**
2. Télécharge **Node.js 24 LTS** (bouton vert à gauche)
3. Lance l'installeur, clique "Next" partout
4. Redémarre ton PC

### Mac
```bash
# Option 1 : télécharge depuis https://nodejs.org
# Option 2 : avec Homebrew
brew install node@24
```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Vérifier l'installation
Ouvre un terminal (**cmd** ou **PowerShell** sur Windows, **Terminal** sur Mac) :
```bash
node --version     # doit afficher v24.x.x
npm --version      # doit afficher 11.x.x
```

---

## ÉTAPE 2 — Installer un éditeur de code (recommandé)

Télécharge **Visual Studio Code** : https://code.visualstudio.com

Extensions utiles à installer dans VS Code :
- **Prisma** (coloration du fichier schema.prisma)
- **ESLint** (détection d'erreurs)
- **Pretty TypeScript Errors** (erreurs lisibles)

Pour installer une extension :
1. Ouvre VS Code
2. Clique sur l'icône Extensions (carré à gauche) ou Ctrl+Shift+X
3. Tape le nom et clique "Install"

---

## ÉTAPE 3 — Mettre en place le projet

### 3.1 — Décompresse l'archive

Décompresse `tournoi-boxe.tar.gz` où tu veux sur ton PC.
- **Windows** : utilise 7-Zip (gratuit) ou WinRAR
- **Mac/Linux** : double-clique ou `tar -xzf tournoi-boxe.tar.gz`

### 3.2 — Ouvre un terminal dans le dossier

**Windows :**
1. Ouvre le dossier `tournoi-boxe` dans l'Explorateur de fichiers
2. Clique dans la barre d'adresse, tape `cmd`, appuie Entrée

**Mac/Linux :**
```bash
cd ~/chemin/vers/tournoi-boxe
```

**VS Code (le plus simple) :**
1. Ouvre VS Code
2. Fichier > Ouvrir un dossier > choisis `tournoi-boxe`
3. Terminal > Nouveau terminal (ou Ctrl+ù)

### 3.3 — Installe les dépendances

```bash
npm install
```

Ça télécharge tout ce qu'il faut (~1-2 minutes, patience).

---

## ÉTAPE 4 — Créer la base de données

```bash
npx prisma generate    # génère le client Prisma
npx prisma db push     # crée les tables dans la base
```

Ça crée automatiquement le fichier `prisma/dev.db` (ta base de données locale).

### (Optionnel) Ajouter des données de test

```bash
npx tsx prisma/seed.ts
```

Ça crée 3 clubs et 5 boxeurs pour tester.

---

## ÉTAPE 5 — Lancer l'application !

```bash
npm run dev
```

Tu verras un message comme :
```
Next.js 16.1.x (Turbopack)
- Local: http://localhost:3000
```

Ouvre ton navigateur sur **http://localhost:3000**

C'est lancé !

Pour arrêter le serveur : Ctrl+C dans le terminal.

---

## Comment utiliser

1. **Crée un club** en cliquant sur "+ Club" (il faut au moins un club)
2. **Inscris un boxeur** en cliquant sur "+ Nouveau boxeur"
3. Remplis le formulaire — les catégories de poids et d'âge sont calculées automatiquement
4. Tu peux **supprimer** un boxeur en cliquant sur le X

---

## Structure du projet

```
tournoi-boxe/
├── prisma/
│   ├── schema.prisma         <- Structure de la base de données
│   ├── seed.ts               <- Données de test
│   └── dev.db                <- La base de données (créée auto)
├── src/
│   ├── generated/prisma/     <- Client Prisma généré (auto)
│   ├── app/
│   │   ├── layout.tsx        <- Template (header, nav)
│   │   ├── page.tsx          <- Page principale
│   │   ├── globals.css       <- Styles
│   │   └── api/
│   │       ├── boxeurs/route.ts      <- API liste + création boxeurs
│   │       ├── boxeurs/[id]/route.ts <- API supprimer boxeur
│   │       └── clubs/route.ts        <- API liste + création clubs
│   └── lib/
│       ├── prisma.ts         <- Connexion base de données
│       └── categories.ts     <- Calcul catégories poids/âge
├── package.json              <- Dépendances du projet
├── tsconfig.json             <- Configuration TypeScript
└── README.md                 <- Ce fichier !
```

---

## Commandes utiles

| Commande | Ce que ça fait |
|---|---|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile pour la production |
| `npm start` | Lance en mode production |
| `npx prisma studio` | Ouvre un éditeur visuel de la base de données |
| `npx prisma db push` | Met à jour la base après un changement de schema |
| `npx prisma generate` | Régénère le client Prisma |

---

## Dépannage

### "npm n'est pas reconnu comme commande"
Node.js n'est pas installé correctement. Réinstalle-le et redémarre ton PC.

### "Cannot find module '@/generated/prisma/client'"
Lance `npx prisma generate` puis relance `npm run dev`.

### Le port 3000 est déjà utilisé
Lance avec un autre port : `npm run dev -- -p 3001`

### La base de données est vide après avoir relancé
Les données persistent ! Si tu veux réinitialiser : supprime `prisma/dev.db` et relance `npx prisma db push`.

---

## Hébergement gratuit (pour plus tard)

Quand tu voudras mettre en ligne :

1. Crée un compte sur **https://vercel.com** (gratuit)
2. Crée une base PostgreSQL gratuite sur **https://neon.tech**
3. Change le provider dans `prisma/schema.prisma` :
   ```
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Ajoute ton `DATABASE_URL` dans les variables d'environnement Vercel
5. Connecte ton repo Git et déploie

---

## Prochaines étapes

- Page de gestion des clubs
- Création de tournois avec dates
- Tirage au sort et tableaux éliminatoires
- Pesée le jour du tournoi
- Export PDF des feuilles de combat
- Saisie des résultats en direct
- Classement et médailles
