import fs from "fs";
import path from "path";

async function backupDatabase() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    process.cwd(),
    "prisma",
    "backups",
    `dev.db.backup-${timestamp}`
  );

  // Créer le dossier backups s'il n'existe pas
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copier la base de données
  fs.copyFileSync(dbPath, backupPath);

  console.log(`✅ Backup créé: ${backupPath}`);
  console.log(`📊 Taille: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
}

backupDatabase().catch(console.error);
