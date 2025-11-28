/*
  Warnings:

  - A unique constraint covering the columns `[sourceTodoId]` on the table `Planning` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Planning" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceTodoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Planning_sourceTodoId_key" ON "Planning"("sourceTodoId");
