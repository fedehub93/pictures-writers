/*
  Warnings:

  - You are about to drop the column `dateOfBirth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Contest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContestCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContestDeadline` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContestPrice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContestSelectionStage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContestTranslations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectAuthor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubmissionScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubmissionSelection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProjectAuthorToSubmission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contest" DROP CONSTRAINT "Contest_imageCoverId_fkey";

-- DropForeignKey
ALTER TABLE "Contest" DROP CONSTRAINT "Contest_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Contest" DROP CONSTRAINT "Contest_rootId_fkey";

-- DropForeignKey
ALTER TABLE "ContestCategory" DROP CONSTRAINT "ContestCategory_contestId_fkey";

-- DropForeignKey
ALTER TABLE "ContestCategory" DROP CONSTRAINT "ContestCategory_formatId_fkey";

-- DropForeignKey
ALTER TABLE "ContestCategory" DROP CONSTRAINT "ContestCategory_genreId_fkey";

-- DropForeignKey
ALTER TABLE "ContestDeadline" DROP CONSTRAINT "ContestDeadline_contestId_fkey";

-- DropForeignKey
ALTER TABLE "ContestPrice" DROP CONSTRAINT "ContestPrice_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ContestPrice" DROP CONSTRAINT "ContestPrice_contestId_fkey";

-- DropForeignKey
ALTER TABLE "ContestPrice" DROP CONSTRAINT "ContestPrice_deadlineId_fkey";

-- DropForeignKey
ALTER TABLE "ContestSelectionStage" DROP CONSTRAINT "ContestSelectionStage_contestId_fkey";

-- DropForeignKey
ALTER TABLE "ContestTranslations" DROP CONSTRAINT "ContestTranslations_contestId_fkey";

-- DropForeignKey
ALTER TABLE "ContestTranslations" DROP CONSTRAINT "ContestTranslations_languageId_fkey";

-- DropForeignKey
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_logoId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationUser" DROP CONSTRAINT "OrganizationUser_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationUser" DROP CONSTRAINT "OrganizationUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_fileId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_formatId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_genreId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectAuthor" DROP CONSTRAINT "ProjectAuthor_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_contestId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_fileId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_formatId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_genreId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_userId_fkey";

-- DropForeignKey
ALTER TABLE "SubmissionScore" DROP CONSTRAINT "SubmissionScore_judgeId_fkey";

-- DropForeignKey
ALTER TABLE "SubmissionScore" DROP CONSTRAINT "SubmissionScore_stageId_fkey";

-- DropForeignKey
ALTER TABLE "SubmissionSelection" DROP CONSTRAINT "SubmissionSelection_stageId_fkey";

-- DropForeignKey
ALTER TABLE "SubmissionSelection" DROP CONSTRAINT "SubmissionSelection_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectAuthorToSubmission" DROP CONSTRAINT "_ProjectAuthorToSubmission_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectAuthorToSubmission" DROP CONSTRAINT "_ProjectAuthorToSubmission_B_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dateOfBirth",
DROP COLUMN "gender";

-- DropTable
DROP TABLE "Contest";

-- DropTable
DROP TABLE "ContestCategory";

-- DropTable
DROP TABLE "ContestDeadline";

-- DropTable
DROP TABLE "ContestPrice";

-- DropTable
DROP TABLE "ContestSelectionStage";

-- DropTable
DROP TABLE "ContestTranslations";

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "OrganizationUser";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "ProjectAuthor";

-- DropTable
DROP TABLE "Submission";

-- DropTable
DROP TABLE "SubmissionScore";

-- DropTable
DROP TABLE "SubmissionSelection";

-- DropTable
DROP TABLE "_ProjectAuthorToSubmission";

-- DropEnum
DROP TYPE "OrgRole";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "SubmissionStatus";

-- DropEnum
DROP TYPE "UserGender";
