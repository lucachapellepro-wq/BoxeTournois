# 🚀 Déploiement Vercel - Guide Rapide

## Résumé en 5 minutes

### 1️⃣ Base de données PostgreSQL (Supabase)

1. Va sur [supabase.com](https://supabase.com) → "Start your project"
2. Crée un projet "tournoi-boxe" (gratuit, région Europe West)
3. **COPIE le mot de passe généré !**
4. Settings → Database → Connection string (URI)
5. Copie l'URL : `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`

### 2️⃣ Migration locale

```bash
# Crée .env avec ta DATABASE_URL de Supabase
echo 'DATABASE_URL="postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"' > .env

# Installe et migre
npm install
npx prisma migrate dev --name init
```

### 3️⃣ Push GitHub

```bash
git init
git add .
git commit -m "Init tournoi boxe PostgreSQL"
git remote add origin https://github.com/TON-USERNAME/tournoi-boxe.git
git push -u origin main
```

### 4️⃣ Déployer Vercel

1. [vercel.com](https://vercel.com) → "Add New" → "Project"
2. Importe ton repo GitHub
3. **Ajoute la variable** : `DATABASE_URL=postgresql://...` (même que .env)
4. Deploy !

✅ **En ligne en 2-3 minutes !**

---

## 📖 Guide complet

Pour plus de détails : [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## ⚠️ Important

- ✅ Schema.prisma est déjà en PostgreSQL
- ✅ package.json a le script `vercel-build`
- ✅ Migrations se font automatiquement au déploiement
- ⚠️ N'oublie pas de copier le mot de passe Supabase !
