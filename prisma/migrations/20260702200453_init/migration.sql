-- CreateTable
CREATE TABLE `Household` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('owner', 'member') NOT NULL DEFAULT 'member',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialAccount` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('checking', 'credit_card', 'meal_voucher', 'cash', 'other') NOT NULL,
    `institution` VARCHAR(191) NULL,
    `last4` VARCHAR(191) NULL,
    `defaultOwnerId` VARCHAR(191) NULL,

    INDEX `FinancialAccount_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportBatch` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `source` ENUM('c6_extrato', 'c6_fatura', 'alelo') NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileHash` VARCHAR(191) NOT NULL,
    `importedById` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NULL,
    `periodEnd` DATETIME(3) NULL,
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `importedRows` INTEGER NOT NULL DEFAULT 0,
    `skippedRows` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ImportBatch_householdId_fileHash_idx`(`householdId`, `fileHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `importBatchId` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `rawDescription` TEXT NULL,
    `amountCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
    `fxAmountCents` INTEGER NULL,
    `fxCurrency` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `categorySource` ENUM('c6', 'rule', 'ai', 'manual', 'uncategorized') NOT NULL DEFAULT 'uncategorized',
    `ownerId` VARCHAR(191) NULL,
    `installment` VARCHAR(191) NULL,
    `dedupHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Transaction_householdId_date_idx`(`householdId`, `date`),
    INDEX `Transaction_householdId_categoryId_idx`(`householdId`, `categoryId`),
    INDEX `Transaction_householdId_ownerId_idx`(`householdId`, `ownerId`),
    UNIQUE INDEX `Transaction_householdId_dedupHash_key`(`householdId`, `dedupHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `kind` ENUM('expense', 'income', 'transfer', 'investment') NOT NULL DEFAULT 'expense',
    `color` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,

    INDEX `Category_householdId_idx`(`householdId`),
    UNIQUE INDEX `Category_householdId_name_key`(`householdId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategoryRule` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `matchType` ENUM('contains', 'regex', 'equals') NOT NULL DEFAULT 'contains',
    `pattern` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 100,

    INDEX `CategoryRule_householdId_priority_idx`(`householdId`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PointsProgram` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `name` ENUM('smiles', 'livelo', 'azul', 'latam') NOT NULL,
    `ownerId` VARCHAR(191) NULL,

    INDEX `PointsProgram_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PointsSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `note` VARCHAR(191) NULL,

    INDEX `PointsSnapshot_programId_date_idx`(`programId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Investment` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('cdb', 'other') NOT NULL DEFAULT 'cdb',
    `institution` VARCHAR(191) NULL,
    `principalCents` INTEGER NOT NULL,
    `appliedAt` DATETIME(3) NOT NULL,
    `maturityAt` DATETIME(3) NULL,
    `ownerId` VARCHAR(191) NULL,

    INDEX `Investment_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvestmentSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `investmentId` VARCHAR(191) NOT NULL,
    `valueCents` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,

    INDEX `InvestmentSnapshot_investmentId_date_idx`(`investmentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAccount` ADD CONSTRAINT `FinancialAccount_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAccount` ADD CONSTRAINT `FinancialAccount_defaultOwnerId_fkey` FOREIGN KEY (`defaultOwnerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportBatch` ADD CONSTRAINT `ImportBatch_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportBatch` ADD CONSTRAINT `ImportBatch_importedById_fkey` FOREIGN KEY (`importedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_importBatchId_fkey` FOREIGN KEY (`importBatchId`) REFERENCES `ImportBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `FinancialAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoryRule` ADD CONSTRAINT `CategoryRule_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoryRule` ADD CONSTRAINT `CategoryRule_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointsProgram` ADD CONSTRAINT `PointsProgram_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointsProgram` ADD CONSTRAINT `PointsProgram_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PointsSnapshot` ADD CONSTRAINT `PointsSnapshot_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `PointsProgram`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investment` ADD CONSTRAINT `Investment_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvestmentSnapshot` ADD CONSTRAINT `InvestmentSnapshot_investmentId_fkey` FOREIGN KEY (`investmentId`) REFERENCES `Investment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
