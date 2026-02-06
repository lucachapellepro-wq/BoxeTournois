# Guide de Déploiement - Tournoi Boxe

## Option 1 : Railway (Recommandé avec SQLite)

Railway supporte SQLite avec volumes persistants, parfait pour garder ta base de données actuelle.

### Étapes :

1. **Créer un compte sur Railway**
   - Va sur [railway.app](https://railway.app)
   - Connecte-toi avec GitHub

2. **Push ton code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/ton-username/tournoi-boxe.git
   git push -u origin main
   ```

3. **Créer un nouveau projet sur Railway**
   - Clique sur "New Project"
   - Sélectionne "Deploy from GitHub repo"
   - Choisis ton repository `tournoi-boxe`

4. **Configurer les variables d'environnement**
   Dans Railway, ajoute ces variables :
   ```
   DATABASE_URL=file:/data/prod.db
   NEXT_PUBLIC_APP_URL=https://ton-app.up.railway.app
   ```

5. **Ajouter un volume pour la base de données**
   - Dans les paramètres du service
   - Clique sur "Volumes"
   - Ajoute un volume monté sur `/data`
   - Cela sauvegarde ta base SQLite de façon persistante

6. **Déployer**
   - Railway détecte automatiquement Next.js
   - Le build se lance automatiquement
   - Prisma génère le client avec `postinstall`

7. **Initialiser la base de données**
   Après le premier déploiement, dans l'onglet "Deployments" :
   ```bash
   npx prisma db push
   ```

### Coût
- Plan gratuit : $5/mois de crédit
- Plan Developer : $20/mois

---

## Option 2 : Vercel (Nécessite migration PostgreSQL)

Vercel est optimisé pour Next.js mais ne supporte pas SQLite (système de fichiers éphémère).

### Migration vers PostgreSQL :

1. **Modifier schema.prisma**
   ```prisma
   datasource db {
     provider = "postgresql"  // au lieu de "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Créer une base PostgreSQL**
   Options :
   - Vercel Postgres (intégré)
   - Supabase (gratuit jusqu'à 500MB)
   - Neon (gratuit)

3. **Migrer les données**
   ```bash
   # Exporter depuis SQLite
   npx prisma db push

   # Créer migration
   npx prisma migrate dev --name init
   ```

4. **Déployer sur Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

5. **Configurer les variables**
   ```
   DATABASE_URL=postgresql://user:password@host/database
   ```

---

## Option 3 : Render

Similaire à Railway, supporte SQLite.

1. **Créer un compte sur [render.com](https://render.com)**

2. **Créer un Web Service**
   - Connecte ton repo GitHub
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Ajouter un Disk**
   - Dans les paramètres
   - Ajoute un disk persistant monté sur `/data`

4. **Variables d'environnement**
   ```
   DATABASE_URL=file:/data/prod.db
   ```

---

## Option 4 : VPS (DigitalOcean, OVH, etc.)

Pour un contrôle total.

### Prérequis
- Un VPS Ubuntu 22.04
- Node.js 18+
- Nginx

### Installation

1. **Installer Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Cloner le projet**
   ```bash
   git clone https://github.com/ton-username/tournoi-boxe.git
   cd tournoi-boxe
   npm install
   ```

3. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Édite :
   ```
   DATABASE_URL="file:./prod.db"
   NEXT_PUBLIC_APP_URL="https://ton-domaine.com"
   ```

4. **Initialiser la base de données**
   ```bash
   npx prisma db push
   ```

5. **Build**
   ```bash
   npm run build
   ```

6. **Lancer avec PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "tournoi-boxe" -- start
   pm2 startup
   pm2 save
   ```

7. **Configurer Nginx**
   ```nginx
   server {
       listen 80;
       server_name ton-domaine.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **SSL avec Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d ton-domaine.com
   ```

---

## Recommandation

- **Petit usage / Prototype** : Railway (simple et rapide)
- **Production + Scaling** : Vercel + PostgreSQL
- **Contrôle total** : VPS

Pour commencer, je recommande **Railway** car tu peux garder SQLite et c'est très simple à mettre en place.
