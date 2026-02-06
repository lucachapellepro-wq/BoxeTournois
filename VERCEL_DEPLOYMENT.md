# Déploiement Vercel - Tournoi Boxe

## 🎯 Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Compte Supabase (gratuit) pour PostgreSQL

---

## 📦 Étape 1 : Créer une base PostgreSQL gratuite (Supabase)

### 1.1 Créer un compte Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Clique "Start your project"
3. Connecte-toi avec GitHub

### 1.2 Créer un nouveau projet

1. Clique "New project"
2. Remplis :
   - **Name** : tournoi-boxe
   - **Database Password** : Génère un mot de passe fort (COPIE-LE !)
   - **Region** : Europe West (Frankfurt) ou proche de toi
   - **Pricing Plan** : Free (500MB, largement suffisant)
3. Clique "Create new project" (attends 2-3 minutes)

### 1.3 Récupérer la DATABASE_URL

1. Dans ton projet Supabase, va dans **Settings** (⚙️ en bas à gauche)
2. Clique sur **Database**
3. Scroll jusqu'à **Connection string**
4. Copie l'URI en mode **URI** (pas Session mode)
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Remplace `[YOUR-PASSWORD]` par le mot de passe que tu as copié

---

## 🗄️ Étape 2 : Initialiser la base de données

### 2.1 Mettre à jour .env localement

Crée/édite `.env` :
```env
DATABASE_URL="postgresql://postgres:[TON-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

### 2.2 Créer la migration

```bash
# Installer les dépendances
npm install

# Créer la migration initiale
npx prisma migrate dev --name init
```

Cela va :
- Créer le dossier `prisma/migrations/`
- Appliquer le schéma à ta base Supabase
- Générer le client Prisma

### 2.3 Vérifier que ça marche

```bash
# Ouvrir Prisma Studio pour voir la base
npx prisma studio
```

Tu devrais voir tes tables vides (Club, Boxeur, Tournoi, Match, etc.)

---

## 📤 Étape 3 : Push sur GitHub

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Application tournoi de boxe - migration PostgreSQL"

# Créer un repo sur github.com puis :
git remote add origin https://github.com/TON-USERNAME/tournoi-boxe.git
git branch -M main
git push -u origin main
```

---

## 🚀 Étape 4 : Déployer sur Vercel

### 4.1 Importer le projet

1. Va sur [vercel.com](https://vercel.com)
2. Clique "Add New..." → "Project"
3. Importe ton repo GitHub `tournoi-boxe`

### 4.2 Configurer le projet

1. **Framework Preset** : Next.js (détecté auto)
2. **Root Directory** : `./` (par défaut)
3. **Build Command** : `npm run build` (par défaut)
4. **Output Directory** : `.next` (par défaut)

### 4.3 Ajouter les variables d'environnement

Dans "Environment Variables", ajoute :

```
DATABASE_URL=postgresql://postgres:[TON-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

⚠️ **Important** : Utilise la même DATABASE_URL que dans ton `.env` local

### 4.4 Déployer

1. Clique "Deploy"
2. Attends 2-3 minutes
3. ✅ C'est en ligne !

Vercel te donnera une URL : `https://tournoi-boxe.vercel.app`

---

## 🔄 Redéployer après des changements

### Changements de code

```bash
git add .
git commit -m "Description des changements"
git push
```

Vercel redéploie automatiquement à chaque push sur `main` !

### Changements de schéma Prisma

Si tu modifies `schema.prisma` :

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name description_du_changement

# Push sur GitHub
git add .
git commit -m "Migration: description_du_changement"
git push
```

Vercel appliquera automatiquement les migrations au build.

---

## 📊 Migrer les données existantes (optionnel)

Si tu as déjà des données dans ta base SQLite locale :

### Option 1 : Export/Import manuel

1. **Exporter depuis SQLite** :
   ```bash
   npx prisma studio
   ```
   Copie manuellement les données importantes

2. **Importer dans PostgreSQL** :
   - Ouvre Supabase SQL Editor
   - Insère les données manuellement

### Option 2 : Script de migration

Crée `prisma/migrate-data.ts` :

```typescript
import { PrismaClient as PrismaClientSQLite } from '@prisma/client';
import { PrismaClient as PrismaClientPostgres } from '@prisma/client';

async function migrate() {
  // Source : SQLite
  const sqlite = new PrismaClientSQLite({
    datasources: { db: { url: 'file:./dev.db' } }
  });

  // Destination : PostgreSQL
  const postgres = new PrismaClientPostgres({
    datasources: { db: { url: process.env.DATABASE_URL } }
  });

  // Migrer les clubs
  const clubs = await sqlite.club.findMany();
  for (const club of clubs) {
    await postgres.club.create({ data: club });
  }

  // Migrer les boxeurs, etc...

  await sqlite.$disconnect();
  await postgres.$disconnect();
}

migrate();
```

Puis :
```bash
npx tsx prisma/migrate-data.ts
```

---

## 🎉 Terminé !

Ton application est en ligne sur Vercel avec PostgreSQL (Supabase) !

### URLs importantes

- **Application** : `https://tournoi-boxe.vercel.app`
- **Supabase Dashboard** : [app.supabase.com](https://app.supabase.com)
- **Vercel Dashboard** : [vercel.com/dashboard](https://vercel.com/dashboard)

### Prochaines étapes

- [ ] Tester l'application en ligne
- [ ] Ajouter un domaine personnalisé (optionnel)
- [ ] Configurer les sauvegardes automatiques dans Supabase

---

## 🆘 Troubleshooting

### Erreur "Can't reach database server"

- Vérifie que DATABASE_URL est correcte dans Vercel
- Vérifie que tu as bien remplacé `[YOUR-PASSWORD]`
- Vérifie que le projet Supabase est actif

### Erreur lors du build Vercel

- Vérifie les logs dans Vercel Dashboard
- Assure-toi que `prisma migrate deploy` s'exécute
- Vérifie que `postinstall` génère bien le client Prisma

### Migration ne s'applique pas

Ajoute dans `package.json` :
```json
{
  "scripts": {
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

Puis dans Vercel Settings → Build & Development :
- **Build Command** : `npm run vercel-build`
