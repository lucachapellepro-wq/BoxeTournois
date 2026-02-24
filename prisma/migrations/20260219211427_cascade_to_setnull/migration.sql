-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_boxeur1Id_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_boxeur2Id_fkey";

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_boxeur1Id_fkey" FOREIGN KEY ("boxeur1Id") REFERENCES "Boxeur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_boxeur2Id_fkey" FOREIGN KEY ("boxeur2Id") REFERENCES "Boxeur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
