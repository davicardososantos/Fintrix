-- AlterTable
ALTER TABLE `FinancialAccount` ADD COLUMN `balanceCents` INTEGER NULL,
    ADD COLUMN `balanceUpdatedAt` DATETIME(3) NULL;
