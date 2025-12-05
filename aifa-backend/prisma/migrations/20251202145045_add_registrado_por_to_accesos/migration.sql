-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `rol` ENUM('SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO') NOT NULL DEFAULT 'OPERATIVO',
    `estaActivo` BOOLEAN NOT NULL DEFAULT true,
    `intentosFallidos` INTEGER NULL DEFAULT 0,
    `bloqueadoHasta` DATETIME(3) NULL,
    `ultimoAcceso` DATETIME(3) NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,
    `filtroAsignadoId` INTEGER NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `identificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('INE', 'PASAPORTE', 'LICENCIA', 'CEDULA', 'OTRO') NOT NULL,
    `numero` VARCHAR(191) NULL,
    `vigente` BOOLEAN NOT NULL DEFAULT true,
    `filtroId` INTEGER NULL,

    UNIQUE INDEX `identificaciones_numero_key`(`numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accesos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NULL,
    `apellidos` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `empresa` VARCHAR(191) NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NULL,
    `registradoPor` VARCHAR(191) NULL,
    `identificacionId` INTEGER NULL,
    `tiasId` VARCHAR(191) NULL,
    `creadoPor` INTEGER NOT NULL,
    `turnoId` INTEGER NULL,
    `filtroId` INTEGER NULL,
    `tieneAcompanante` BOOLEAN NOT NULL DEFAULT false,
    `nombreAcompanante` VARCHAR(191) NULL,
    `direccionAcompanante` VARCHAR(191) NULL,
    `conGrupo` BOOLEAN NOT NULL DEFAULT false,
    `cantidadGrupo` INTEGER NULL,
    `horaEntrada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `horaSalida` DATETIME(3) NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tias` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(5) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `filtroId` INTEGER NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turnos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombreTurno` VARCHAR(191) NOT NULL,
    `horaInicio` DATETIME(3) NOT NULL,
    `horaFin` DATETIME(3) NULL,
    `estaActivo` BOOLEAN NOT NULL DEFAULT true,
    `creadoPor` INTEGER NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TurnoUsuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turnoId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `fechaAsignacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TurnoUsuario_turnoId_usuarioId_key`(`turnoId`, `usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backup_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `detalles` JSON NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `filtros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `ubicacion` VARCHAR(191) NULL,
    `estaActivo` BOOLEAN NOT NULL DEFAULT true,
    `cantidad` INTEGER NULL,
    `usuarioCreadorId` INTEGER NULL,

    UNIQUE INDEX `filtros_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `usuarioId` INTEGER NULL,
    `accesoId` INTEGER NULL,
    `turnoId` INTEGER NULL,
    `identificacionId` INTEGER NULL,
    `filtroId` INTEGER NULL,
    `tiasId` VARCHAR(191) NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_filtroAsignadoId_fkey` FOREIGN KEY (`filtroAsignadoId`) REFERENCES `filtros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `identificaciones` ADD CONSTRAINT `identificaciones_filtroId_fkey` FOREIGN KEY (`filtroId`) REFERENCES `filtros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accesos` ADD CONSTRAINT `accesos_identificacionId_fkey` FOREIGN KEY (`identificacionId`) REFERENCES `identificaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accesos` ADD CONSTRAINT `accesos_tiasId_fkey` FOREIGN KEY (`tiasId`) REFERENCES `tias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accesos` ADD CONSTRAINT `accesos_creadoPor_fkey` FOREIGN KEY (`creadoPor`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accesos` ADD CONSTRAINT `accesos_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accesos` ADD CONSTRAINT `accesos_filtroId_fkey` FOREIGN KEY (`filtroId`) REFERENCES `filtros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tias` ADD CONSTRAINT `tias_filtroId_fkey` FOREIGN KEY (`filtroId`) REFERENCES `filtros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `turnos` ADD CONSTRAINT `turnos_creadoPor_fkey` FOREIGN KEY (`creadoPor`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TurnoUsuario` ADD CONSTRAINT `TurnoUsuario_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TurnoUsuario` ADD CONSTRAINT `TurnoUsuario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backup_logs` ADD CONSTRAINT `backup_logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `filtros` ADD CONSTRAINT `filtros_usuarioCreadorId_fkey` FOREIGN KEY (`usuarioCreadorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_accesoId_fkey` FOREIGN KEY (`accesoId`) REFERENCES `accesos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_identificacionId_fkey` FOREIGN KEY (`identificacionId`) REFERENCES `identificaciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_filtroId_fkey` FOREIGN KEY (`filtroId`) REFERENCES `filtros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_tiasId_fkey` FOREIGN KEY (`tiasId`) REFERENCES `tias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
