# 🚀 Migration vers Vercel Postgres

Guide complet pour migrer de Supabase vers Vercel Postgres avec toutes tes données.

## ✅ Étape 1 : Export des données (FAIT ✓)

Les données ont été exportées depuis Supabase :
- ✅ 7 clubs
- ✅ 39 boxeurs
- ✅ 1 tournoi
- ✅ 38 inscriptions
- ✅ 32 matchs

Fichier : `vercel-postgres-import.json` (40 KB)

---

## 🗄️ Étape 2 : Créer la base Vercel Postgres

### 2.1 Dans l'interface Vercel

1. Va sur [vercel.com](https://vercel.com)
2. Sélectionne ton projet **BoxeTournois**
3. Clique sur l'onglet **"Storage"** en haut
4. Clique sur **"Create Database"**
5. Sélectionne **"Postgres"**
6. Donne un nom : **tournoi-boxe-db**
7. Choisis la région : **Washington, D.C., USA (iad1)** (la plus proche de l'Europe disponible)
8. Clique sur **"Create"**

### 2.2 Connexion automatique

Vercel va automatiquement :
- ✅ Créer la base de données PostgreSQL
- ✅ Ajouter les variables d'environnement à ton projet
- ✅ Configurer `DATABASE_URL` avec la bonne URL (pooling déjà inclus)

**Ça prend environ 1-2 minutes.**

---

## 🔗 Étape 3 : Récupérer les identifiants

1. Dans Vercel → Storage → Ta base **tournoi-boxe-db**
2. Va dans l'onglet **".env.local"**
3. Copie **tout le contenu** (plusieurs variables)
4. Crée un fichier `.env.local` à la racine de ton projet
5. Colle le contenu

**Exemple de ce que tu vas copier** :
```bash
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NO_SSL="..."
POSTGRES_URL_NON_POOLING="..."
# etc.
```

Pour Prisma, on va utiliser `POSTGRES_PRISMA_URL`.

---

## 🔧 Étape 4 : Configuration locale

### 4.1 Mettre à jour `.env`

Remplace le contenu de ton fichier `.env` :

```bash
# Vercel Postgres (Prisma)
DATABASE_URL="COLLE_ICI_LA_VALEUR_DE_POSTGRES_PRISMA_URL"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important** : Utilise la valeur de `POSTGRES_PRISMA_URL` (pas `POSTGRES_URL`)

### 4.2 Appliquer les migrations Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy
```

Cela va créer toutes les tables dans ta nouvelle base Vercel Postgres.

---

## 📥 Étape 5 : Importer les données

Une fois les tables créées, importe tes données :

```bash
npx tsx scripts/import-to-vercel-postgres.ts
```

Tu devrais voir :
```
✅ Import terminé avec succès !
📊 Résumé final:
   - 7 clubs
   - 39 boxeurs
   - 1 tournois
   - 38 inscriptions
   - 32 matchs
```

---

## ✅ Étape 6 : Vérifier les données

```bash
# Voir les clubs
npx tsx scripts/show-clubs.ts

# Ou ouvrir Prisma Studio
npx prisma studio
```

---

## 🚀 Étape 7 : Déployer sur Vercel

### 7.1 Commit et Push

```bash
git add .
git commit -m "Migration vers Vercel Postgres"
git push origin main
```

### 7.2 Déploiement automatique

Vercel va automatiquement :
1. Détecter le push
2. Lancer le build
3. Appliquer les migrations (`vercel-build` script)
4. Déployer l'application

**C'est tout !** 🎉

---

## 🔍 Vérifications Post-Migration

### Dans Vercel

1. Va sur **Deployments** → Dernier déploiement
2. Vérifie que le build est **Success** ✅
3. Clique sur l'URL de ton app
4. Teste que tout fonctionne

### Dans Vercel Postgres

1. Va sur **Storage** → Ta base
2. Clique sur **"Data"** pour voir tes tables
3. Vérifie que tu vois tes données

---

## 📊 Comparaison Supabase vs Vercel Postgres

| Feature | Supabase | Vercel Postgres |
|---------|----------|-----------------|
| Setup | Manuel | Automatique |
| Connection Pooling | Manuel (port 6543) | Automatique |
| Variables d'environnement | Manuelle | Automatique |
| Intégration Vercel | Externe | Native |
| Interface admin | ⭐⭐⭐⭐⭐ Excellente | ⭐⭐⭐ Basique |
| Gratuit | 500 MB | 256 MB |
| **Simplicité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Pour ton projet** : Vercel Postgres est **largement suffisant** et **beaucoup plus simple**.

---

## 🗑️ Nettoyage (Optionnel)

Une fois que tout fonctionne sur Vercel Postgres :

### Supprimer les fichiers de migration Supabase
```bash
rm vercel-postgres-import.json
rm scripts/export-current-data.ts
rm scripts/migrate-*.ts
```

### Supprimer le projet Supabase
1. Va sur [supabase.com](https://supabase.com)
2. Ton projet → Settings → General
3. "Delete Project" (si tu n'en as plus besoin)

---

## 🐛 Dépannage

### Erreur "Can't reach database server"
- Vérifie que tu as bien copié `POSTGRES_PRISMA_URL` (pas `POSTGRES_URL`)
- Redémarre ton terminal
- Relance `npx prisma generate`

### Erreur "Table does not exist"
- Lance d'abord : `npx prisma migrate deploy`
- Puis : `npx tsx scripts/import-to-vercel-postgres.ts`

### Import échoue
- Vérifie que le fichier `vercel-postgres-import.json` existe
- Relance l'export : `npx tsx scripts/export-current-data.ts`

---

## 📞 Support

Si tu rencontres un problème, vérifie :
1. Les logs Vercel : Deployments → Logs
2. Les variables d'environnement : Settings → Environment Variables
3. La connexion locale : `npx prisma studio`

---

## 🎉 Résultat Final

Après cette migration :
- ✅ Base de données Vercel Postgres créée
- ✅ Toutes les données migrées (7 clubs, 39 boxeurs, etc.)
- ✅ Application déployée sur Vercel
- ✅ Plus de problèmes de connection pooling
- ✅ Configuration automatique
- ✅ Déploiements continus fonctionnels

**Bienvenue dans l'écosystème Vercel ! 🚀**
