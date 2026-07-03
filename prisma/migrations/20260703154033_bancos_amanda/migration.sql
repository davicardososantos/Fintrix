-- AlterTable
ALTER TABLE `ImportBatch` MODIFY `source` ENUM('c6_extrato', 'c6_fatura', 'alelo', 'nubank_conta', 'santander_conta') NOT NULL;

