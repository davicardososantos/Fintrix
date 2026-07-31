-- Programa de pontos vira texto livre (antes: ENUM fixo de 4 valores)
ALTER TABLE `PointsProgram` MODIFY `name` VARCHAR(191) NOT NULL;

-- slug antigo -> rótulo exibido (o texto passa a ser o próprio nome na tela)
UPDATE `PointsProgram` SET `name` = 'Smiles'     WHERE `name` = 'smiles';
UPDATE `PointsProgram` SET `name` = 'Livelo'     WHERE `name` = 'livelo';
UPDATE `PointsProgram` SET `name` = 'TudoAzul'   WHERE `name` = 'azul';
UPDATE `PointsProgram` SET `name` = 'LATAM Pass' WHERE `name` = 'latam';
