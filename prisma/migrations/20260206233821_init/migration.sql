-- CreateTable
CREATE TABLE "Club" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "coach" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boxeur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "sexe" TEXT NOT NULL,
    "poids" DOUBLE PRECISION NOT NULL,
    "gant" TEXT NOT NULL,
    "clubId" INTEGER NOT NULL,
    "categoriePoids" TEXT,
    "categorieAge" TEXT,
    "infoIncomplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boxeur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournoi" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournoi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournoiBoxeur" (
    "tournoiId" INTEGER NOT NULL,
    "boxeurId" INTEGER NOT NULL,

    CONSTRAINT "TournoiBoxeur_pkey" PRIMARY KEY ("tournoiId","boxeurId")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "tournoiId" INTEGER NOT NULL,
    "boxeur1Id" INTEGER,
    "boxeur2Id" INTEGER,
    "matchType" TEXT NOT NULL,
    "sexe" TEXT NOT NULL DEFAULT 'M',
    "categorieAge" TEXT NOT NULL,
    "categoriePoids" TEXT NOT NULL,
    "gant" TEXT NOT NULL,
    "categoryDisplay" TEXT NOT NULL,
    "bracketRound" TEXT,
    "bracketPosition" INTEGER,
    "nextMatchId" INTEGER,
    "poolName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "winnerId" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_tournoiId_categorieAge_categoriePoids_gant_idx" ON "Match"("tournoiId", "categorieAge", "categoriePoids", "gant");

-- CreateIndex
CREATE INDEX "Match_tournoiId_matchType_idx" ON "Match"("tournoiId", "matchType");

-- AddForeignKey
ALTER TABLE "Boxeur" ADD CONSTRAINT "Boxeur_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournoiBoxeur" ADD CONSTRAINT "TournoiBoxeur_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "Tournoi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournoiBoxeur" ADD CONSTRAINT "TournoiBoxeur_boxeurId_fkey" FOREIGN KEY ("boxeurId") REFERENCES "Boxeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournoiId_fkey" FOREIGN KEY ("tournoiId") REFERENCES "Tournoi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_boxeur1Id_fkey" FOREIGN KEY ("boxeur1Id") REFERENCES "Boxeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_boxeur2Id_fkey" FOREIGN KEY ("boxeur2Id") REFERENCES "Boxeur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Boxeur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
