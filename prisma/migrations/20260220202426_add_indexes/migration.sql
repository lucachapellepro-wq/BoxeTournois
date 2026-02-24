-- CreateIndex
CREATE INDEX "Boxeur_clubId_idx" ON "Boxeur"("clubId");

-- CreateIndex
CREATE INDEX "Boxeur_sexe_idx" ON "Boxeur"("sexe");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_winnerId_idx" ON "Match"("winnerId");
