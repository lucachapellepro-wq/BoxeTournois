# 🚀 Guide de Déploiement - Vercel + Supabase

## ✅ Préparation Complète

Votre application est maintenant prête pour le déploiement ! Voici ce qui a été fait :

- ✅ Base de données PostgreSQL créée sur Supabase
- ✅ Migrations Prisma appliquées
- ✅ **Toutes vos données ont été migrées** (7 clubs, 39 boxeurs, 1 tournoi, 32 matchs)
- ✅ Configuration Vercel prête
- ✅ Script de build configuré

## 📝 Étapes de Déploiement sur Vercel

### Option 1: Déploiement via l'interface web (Recommandé)

1. **Créer un compte Vercel**
   - Va sur [vercel.com](https://vercel.com)
   - Connecte-toi avec ton compte GitHub

2. **Importer ton projet**
   - Clique sur "Add New..." → "Project"
   - Sélectionne ton repository GitHub "BoxeTournois"
   - Vercel détectera automatiquement Next.js

3. **Configurer les variables d'environnement**
   - Dans "Environment Variables", ajoute :
     ```
     DATABASE_URL=postgresql://postgres:cM7rKq1fNFw3jFkX@db.lluhhqolvlyfdamafxuf.supabase.co:5432/postgres
     ```
   - ⚠️ **Important** : Copie exactement cette URL (elle contient ton mot de passe Supabase)

4. **Déployer**
   - Clique sur "Deploy"
   - Attend 2-3 minutes
   - ✅ Ton application sera en ligne !

### Option 2: Déploiement via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Ajouter la variable d'environnement
vercel env add DATABASE_URL
# Colle: postgresql://postgres:cM7rKq1fNFw3jFkX@db.lluhhqolvlyfdamafxuf.supabase.co:5432/postgres

# Redéployer avec les variables
vercel --prod
```

## 🔄 Déploiements Futurs

Une fois configuré, chaque fois que tu push sur GitHub :
```bash
git add .
git commit -m "Update"
git push
```

Vercel déploiera automatiquement la nouvelle version ! 🎉

## 🗄️ Informations Supabase

- **Host**: db.lluhhqolvlyfdamafxuf.supabase.co
- **Database**: postgres
- **User**: postgres
- **Password**: cM7rKq1fNFw3jFkX

Tu peux gérer ta base de données sur [supabase.com](https://supabase.com) → Ton projet → "Table Editor"

## 📊 Données Actuelles

Actuellement dans la base Supabase :
- 7 clubs
- 39 boxeurs
- 1 tournoi (avec 32 matchs)
- 38 inscriptions

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ne commit jamais le fichier `.env` sur Git !
Le fichier `.gitignore` est déjà configuré pour l'exclure.

## 🐛 Dépannage

### Erreur "Database connection failed"
- Vérifie que DATABASE_URL est correctement configurée dans Vercel
- Va sur Vercel → Ton projet → Settings → Environment Variables

### Erreur "Prisma migrate failed"
- Les migrations sont automatiquement appliquées grâce au script `vercel-build`
- Si problème, vérifie les logs : Vercel → Ton projet → Deployments → Logs

### Page blanche après déploiement
- Vérifie les logs de build
- Assure-toi que toutes les dépendances sont dans `package.json`

## 📞 Support

En cas de problème :
1. Vérifie les logs Vercel (Deployments → Logs)
2. Vérifie la connexion Supabase (Settings → Database)
3. Teste localement avec `npm run dev`

---

🎉 **Bon déploiement !**
