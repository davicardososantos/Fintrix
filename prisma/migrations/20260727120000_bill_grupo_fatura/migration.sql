-- AlterTable
ALTER TABLE `Bill` ADD COLUMN `parentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Bill_parentId_idx` ON `Bill`(`parentId`);

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Bill`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- CreateTable
CREATE TABLE `BillPeriodAmount` (
    `id` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `periodKey` VARCHAR(191) NOT NULL,
    `amountCents` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BillPeriodAmount_householdId_idx`(`householdId`),
    UNIQUE INDEX `BillPeriodAmount_billId_periodKey_key`(`billId`, `periodKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BillPeriodAmount` ADD CONSTRAINT `BillPeriodAmount_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `Bill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillPeriodAmount` ADD CONSTRAINT `BillPeriodAmount_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
