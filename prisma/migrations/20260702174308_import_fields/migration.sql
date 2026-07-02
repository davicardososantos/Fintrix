-- AlterTable
ALTER TABLE `ImportBatch` ADD COLUMN `errorRows` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `ownerHint` VARCHAR(191) NULL,
    ADD COLUMN `rawCategory` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `FinancialAccount_householdId_name_key` ON `FinancialAccount`(`householdId`, `name`);

