"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupController = void 0;
const data_1 = require("../data");
class BackupController {
    static getEstadisticas = async (req, res) => {
        try {
            const [totalAccesos, totalTurnos, totalUsuarios, totalIdentificaciones, totalTIAS, totalFiltros, totalBackups] = await Promise.all([
                data_1.prisma.acceso.count(),
                data_1.prisma.turno.count(),
                data_1.prisma.usuario.count(),
                data_1.prisma.identificacion.count(),
                data_1.prisma.tIAS.count(),
                data_1.prisma.filtro.count(),
                data_1.prisma.backupLog.count({
                    where: { tipo: 'EXPORTACION' }
                })
            ]);
            const totalRegistros = totalAccesos + totalTurnos + totalUsuarios + totalIdentificaciones + totalTIAS + totalFiltros;
            const tamanoEstimadoMB = (totalRegistros * 0.5 / 1024).toFixed(2);
            // Obtener el último backup
            const ultimoBackup = await data_1.prisma.backupLog.findFirst({
                where: { tipo: 'EXPORTACION' },
                orderBy: { fechaCreacion: 'desc' },
                select: { fechaCreacion: true }
            });
            res.json({
                totalRegistros,
                totalAccesos,
                totalTurnos,
                totalUsuarios,
                totalIdentificaciones,
                totalTIAS,
                totalFiltros,
                totalBackups,
                tamanoEstimado: `${tamanoEstimadoMB} MB`,
                ultimoBackup: ultimoBackup?.fechaCreacion || null
            });
        }
        catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static exportarDB = async (req, res) => {
        try {
            const { formato, incluirDatos, incluirEstructura, fechaInicio, fechaFin } = req.body;
            const usuario = req.user;
            // Validar permisos (solo administradores y superadmin)
            if (!['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO'].includes(usuario.rol)) {
                return res.status(403).json({ error: 'No autorizado para realizar exportaciones' });
            }
            // Construir condiciones de fecha si se proporcionan
            const whereFecha = {};
            if (fechaInicio) {
                whereFecha.gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                whereFecha.lte = new Date(fechaFin);
            }
            // Obtener datos según formato y opciones
            let resultadoExportacion;
            if (formato === 'json') {
                resultadoExportacion = await BackupController.exportarJSON(incluirDatos, incluirEstructura, whereFecha);
            }
            else if (formato === 'sql') {
                resultadoExportacion = await BackupController.exportarSQL(incluirDatos, incluirEstructura, whereFecha);
            }
            else {
                return res.status(400).json({ error: 'Formato no soportado' });
            }
            // Metadata
            const metadata = {
                exportadoPor: `${usuario.nombre} ${usuario.apellidos}`,
                fechaExportacion: new Date().toISOString(),
                version: '1.0',
                opciones: { formato, incluirDatos, incluirEstructura, fechaInicio, fechaFin },
                estadisticas: resultadoExportacion.estadisticas
            };
            const resultadoFinal = {
                metadata,
                datos: resultadoExportacion.datos
            };
            // Guardar registro de exportación en BackupLog
            const backupLog = await data_1.prisma.backupLog.create({
                data: {
                    tipo: 'EXPORTACION',
                    descripcion: `Exportación ${formato.toUpperCase()} - ${usuario.nombre}`,
                    usuarioId: usuario.id,
                    detalles: metadata
                }
            });
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'SISTEMA',
                    accion: 'EXPORTACIÓN_DB',
                    descripcion: `Usuario ${usuario.id} exportó BD en formato ${formato}`,
                    usuarioId: usuario.id
                }
            });
            console.log('Backup registrado en la base de datos:', backupLog.id);
            res.json(resultadoFinal);
        }
        catch (error) {
            console.error('Error en exportación:', error);
            res.status(500).json({ error: 'Error durante la exportación' });
        }
    };
    static async exportarJSON(incluirDatos, incluirEstructura, whereFecha) {
        const datos = {};
        let totalRegistros = 0;
        if (incluirEstructura) {
            datos.estructura = {
                version: '1.0',
                fechaGeneracion: new Date().toISOString(),
                tablas: ['usuarios', 'accesos', 'turnos', 'identificaciones', 'tias', 'turnoUsuario', 'backupLogs', 'filtros', 'auditoria']
            };
        }
        if (incluirDatos) {
            const [usuarios, accesos, turnos, identificaciones, tias, turnoUsuario, backupLogs, filtros, auditorias] = await Promise.all([
                data_1.prisma.usuario.findMany({
                    select: {
                        id: true,
                        email: true,
                        password: true,
                        nombre: true,
                        apellidos: true,
                        telefono: true,
                        rol: true,
                        estaActivo: true,
                        intentosFallidos: true,
                        bloqueadoHasta: true,
                        ultimoAcceso: true,
                        fechaCreacion: true,
                        fechaActualizacion: true,
                        filtroAsignadoId: true
                    }
                }),
                data_1.prisma.acceso.findMany({
                    where: whereFecha ? { fechaCreacion: whereFecha } : {},
                    include: {
                        creador: {
                            select: {
                                id: true,
                                nombre: true,
                                apellidos: true
                            }
                        },
                        turno: {
                            select: {
                                id: true,
                                nombreTurno: true
                            }
                        },
                        identificacion: {
                            select: {
                                id: true,
                                tipo: true,
                                numero: true
                            }
                        },
                        tias: {
                            select: {
                                id: true,
                                tipo: true
                            }
                        },
                        filtro: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        }
                    }
                }),
                data_1.prisma.turno.findMany({
                    include: {
                        creador: {
                            select: {
                                nombre: true,
                                apellidos: true
                            }
                        },
                        usuarios: {
                            include: {
                                usuario: {
                                    select: {
                                        id: true,
                                        nombre: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }),
                data_1.prisma.identificacion.findMany({
                    include: {
                        filtro: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        }
                    }
                }),
                data_1.prisma.tIAS.findMany({
                    include: {
                        filtro: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        },
                        accesos: {
                            select: {
                                id: true,
                                nombre: true,
                                apellidos: true
                            }
                        }
                    }
                }),
                data_1.prisma.turnoUsuario.findMany({
                    include: {
                        turno: {
                            select: { nombreTurno: true }
                        },
                        usuario: {
                            select: { nombre: true, email: true }
                        }
                    }
                }),
                data_1.prisma.backupLog.findMany({
                    include: {
                        usuario: {
                            select: { nombre: true, apellidos: true, email: true }
                        }
                    },
                    orderBy: { fechaCreacion: 'desc' },
                    take: 100
                }),
                data_1.prisma.filtro.findMany({
                    include: {
                        usuarioCreador: {
                            select: { nombre: true, email: true }
                        },
                        usuariosAsignados: {
                            select: { id: true, nombre: true, email: true }
                        },
                        identificaciones: {
                            select: { id: true, tipo: true, numero: true }
                        },
                        tias: {
                            select: { id: true, tipo: true }
                        }
                    }
                }),
                data_1.prisma.auditoria.findMany({
                    where: whereFecha ? { fechaCreacion: whereFecha } : {},
                    include: {
                        usuario: {
                            select: { nombre: true, email: true }
                        },
                        acceso: {
                            select: { id: true, nombre: true }
                        },
                        turno: {
                            select: { id: true, nombreTurno: true }
                        },
                        identificacion: {
                            select: { id: true, tipo: true }
                        },
                        tias: {
                            select: { id: true, tipo: true }
                        },
                        filtro: {
                            select: { id: true, nombre: true }
                        }
                    },
                    take: 1000
                })
            ]);
            datos.usuarios = usuarios;
            datos.accesos = accesos;
            datos.turnos = turnos;
            datos.identificaciones = identificaciones;
            datos.tias = tias;
            datos.turnoUsuario = turnoUsuario;
            datos.backupLogs = backupLogs;
            datos.filtros = filtros;
            datos.auditorias = auditorias;
            totalRegistros = usuarios.length + accesos.length + turnos.length +
                identificaciones.length + tias.length + turnoUsuario.length +
                backupLogs.length + filtros.length + auditorias.length;
        }
        return {
            datos,
            estadisticas: { totalRegistros }
        };
    }
    static async exportarSQL(incluirDatos, incluirEstructura, whereFecha) {
        try {
            let sqlContent = '';
            const estadisticas = { totalRegistros: 0 };
            // Generar estructura de tablas
            if (incluirEstructura) {
                sqlContent += BackupController.generarEstructuraSQL();
            }
            // Generar datos
            if (incluirDatos) {
                const datosSQL = await BackupController.generarDatosSQL(whereFecha);
                sqlContent += datosSQL.sql;
                estadisticas.totalRegistros = datosSQL.totalRegistros;
            }
            // Añadir comentarios informativos
            const header = `-- Backup SQL generado el ${new Date().toISOString()}\n`;
            const header2 = `-- Base de datos: Sistema de Control de Accesos\n`;
            const header3 = `-- Total registros: ${estadisticas.totalRegistros}\n\n`;
            return {
                datos: header + header2 + header3 + sqlContent,
                estadisticas
            };
        }
        catch (error) {
            throw new Error(`Error generando SQL: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    static generarEstructuraSQL() {
        return `
-- =============================================
-- ESTRUCTURA DE TABLAS
-- =============================================

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    rol ENUM('SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO') DEFAULT 'OPERATIVO',
    estaActivo BOOLEAN DEFAULT TRUE,
    intentosFallidos INT DEFAULT 0,
    bloqueadoHasta DATETIME NULL,
    ultimoAcceso DATETIME NULL,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    filtroAsignadoId INT NULL
);

-- Tabla: identificaciones
CREATE TABLE IF NOT EXISTS identificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('INE', 'PASAPORTE', 'LICENCIA', 'CEDULA', 'OTRO') NOT NULL,
    numero VARCHAR(255) UNIQUE,
    vigente BOOLEAN DEFAULT TRUE,
    filtroId INT NULL
);

-- Tabla: tias
CREATE TABLE IF NOT EXISTS tias (
    id VARCHAR(255) PRIMARY KEY,
    tipo VARCHAR(5) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    filtroId INT NULL,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: turnos
CREATE TABLE IF NOT EXISTS turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombreTurno VARCHAR(100) NOT NULL,
    horaInicio DATETIME NOT NULL,
    horaFin DATETIME,
    estaActivo BOOLEAN DEFAULT TRUE,
    creadoPor INT NOT NULL,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creadoPor) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla: filtros
CREATE TABLE IF NOT EXISTS filtros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    cantidad INT NULL,
    estaActivo BOOLEAN DEFAULT TRUE,
    usuarioCreadorId INT NULL,
    FOREIGN KEY (usuarioCreadorId) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla: accesos
CREATE TABLE IF NOT EXISTS accesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NULL,
    apellidos VARCHAR(100) NULL,
    telefono VARCHAR(20),
    empresa VARCHAR(100),
    motivo TEXT NOT NULL,
    area VARCHAR(100) NULL,
    registradoPor VARCHAR(255) NULL,
    identificacionId INT NULL,
    tiasId VARCHAR(255) NULL,
    creadoPor INT NOT NULL,
    turnoId INT NULL,
    filtroId INT NULL,
    tieneAcompanante BOOLEAN DEFAULT FALSE,
    nombreAcompanante VARCHAR(100) NULL,
    direccionAcompanante TEXT NULL,
    conGrupo BOOLEAN DEFAULT FALSE,
    cantidadGrupo INT NULL,
    horaEntrada DATETIME DEFAULT CURRENT_TIMESTAMP,
    horaSalida DATETIME NULL,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (identificacionId) REFERENCES identificaciones(id) ON DELETE RESTRICT,
    FOREIGN KEY (tiasId) REFERENCES tias(id) ON DELETE SET NULL,
    FOREIGN KEY (creadoPor) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (turnoId) REFERENCES turnos(id),
    FOREIGN KEY (filtroId) REFERENCES filtros(id) ON DELETE SET NULL
);

-- Tabla: turnoUsuario (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS turnoUsuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turnoId INT NOT NULL,
    usuarioId INT NOT NULL,
    fechaAsignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_turno_usuario (turnoId, usuarioId),
    FOREIGN KEY (turnoId) REFERENCES turnos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla: backup_logs
CREATE TABLE IF NOT EXISTS backup_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    usuarioId INT NOT NULL,
    detalles JSON,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla: auditoria
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    accion VARCHAR(255) NOT NULL,
    descripcion TEXT,
    usuarioId INT NULL,
    accesoId INT NULL,
    turnoId INT NULL,
    identificacionId INT NULL,
    filtroId INT NULL,
    tiasId VARCHAR(255) NULL,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (accesoId) REFERENCES accesos(id),
    FOREIGN KEY (turnoId) REFERENCES turnos(id),
    FOREIGN KEY (identificacionId) REFERENCES identificaciones(id),
    FOREIGN KEY (filtroId) REFERENCES filtros(id),
    FOREIGN KEY (tiasId) REFERENCES tias(id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_accesos_fecha ON accesos(fechaCreacion);
CREATE INDEX IF NOT EXISTS idx_accesos_identificacion ON accesos(identificacionId);
CREATE INDEX IF NOT EXISTS idx_accesos_tias ON accesos(tiasId);
CREATE INDEX IF NOT EXISTS idx_accesos_turno ON accesos(turnoId);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_backup_logs_fecha ON backup_logs(fechaCreacion);
CREATE INDEX IF NOT EXISTS idx_backup_logs_usuario ON backup_logs(usuarioId);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fechaCreacion);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuarioId);

-- Actualizar la FK de filtroAsignadoId después de crear la tabla filtros
ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_filtro 
FOREIGN KEY (filtroAsignadoId) REFERENCES filtros(id) ON DELETE SET NULL;

-- FK para la relación identificacion-filtro
ALTER TABLE identificaciones ADD CONSTRAINT fk_identificacion_filtro 
FOREIGN KEY (filtroId) REFERENCES filtros(id) ON DELETE SET NULL;

-- FK para la relación tias-filtro
ALTER TABLE tias ADD CONSTRAINT fk_tias_filtro 
FOREIGN KEY (filtroId) REFERENCES filtros(id) ON DELETE SET NULL;

\n`;
    }
    static async generarDatosSQL(whereFecha) {
        let sqlContent = '';
        let totalRegistros = 0;
        // Obtener datos de todas las tablas según el esquema Prisma
        const [usuarios, identificaciones, tias, turnos, filtros, accesos, turnoUsuario, backupLogs, auditorias] = await Promise.all([
            data_1.prisma.usuario.findMany({
                select: {
                    id: true,
                    email: true,
                    password: true,
                    nombre: true,
                    apellidos: true,
                    telefono: true,
                    rol: true,
                    estaActivo: true,
                    intentosFallidos: true,
                    bloqueadoHasta: true,
                    ultimoAcceso: true,
                    fechaCreacion: true,
                    fechaActualizacion: true,
                    filtroAsignadoId: true
                }
            }),
            data_1.prisma.identificacion.findMany({
                include: {
                    filtro: { select: { id: true } }
                }
            }),
            data_1.prisma.tIAS.findMany({
                include: {
                    filtro: { select: { id: true } }
                }
            }),
            data_1.prisma.turno.findMany({
                include: {
                    creador: { select: { id: true } }
                }
            }),
            data_1.prisma.filtro.findMany({
                include: {
                    usuarioCreador: { select: { id: true } }
                }
            }),
            data_1.prisma.acceso.findMany({
                where: whereFecha ? { fechaCreacion: whereFecha } : {},
                include: {
                    creador: { select: { id: true } },
                    turno: { select: { id: true } },
                    identificacion: { select: { id: true } },
                    tias: { select: { id: true } },
                    filtro: { select: { id: true } }
                }
            }),
            data_1.prisma.turnoUsuario.findMany(),
            data_1.prisma.backupLog.findMany({
                include: {
                    usuario: { select: { id: true } }
                },
                orderBy: { fechaCreacion: 'desc' },
                take: 50
            }),
            data_1.prisma.auditoria.findMany({
                where: whereFecha ? { fechaCreacion: whereFecha } : {},
                include: {
                    usuario: { select: { id: true } },
                    acceso: { select: { id: true } },
                    turno: { select: { id: true } },
                    identificacion: { select: { id: true } },
                    tias: { select: { id: true } },
                    filtro: { select: { id: true } }
                },
                take: 1000
            })
        ]);
        // Función helper para escapar valores SQL
        const escapeSQL = (value) => {
            if (value === null || value === undefined)
                return 'NULL';
            if (typeof value === 'boolean')
                return value ? 'TRUE' : 'FALSE';
            if (value instanceof Date)
                return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (typeof value === 'number')
                return value.toString();
            if (typeof value === 'object')
                return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return `'${value.toString().replace(/'/g, "''")}'`;
        };
        // Insertar usuarios
        if (usuarios.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE USUARIOS (${usuarios.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO usuarios (id, email, password, nombre, apellidos, telefono, rol, estaActivo, intentosFallidos, bloqueadoHasta, ultimoAcceso, fechaCreacion, fechaActualizacion, filtroAsignadoId) VALUES\n`;
            const userValues = usuarios.map(user => `(${user.id}, ${escapeSQL(user.email)}, ${escapeSQL(user.password)}, ${escapeSQL(user.nombre)}, ${escapeSQL(user.apellidos)}, ${escapeSQL(user.telefono)}, ${escapeSQL(user.rol)}, ${escapeSQL(user.estaActivo)}, ${user.intentosFallidos || 0}, ${escapeSQL(user.bloqueadoHasta)}, ${escapeSQL(user.ultimoAcceso)}, ${escapeSQL(user.fechaCreacion)}, ${escapeSQL(user.fechaActualizacion)}, ${user.filtroAsignadoId || 'NULL'})`).join(',\n');
            sqlContent += userValues + ';\n\n';
            totalRegistros += usuarios.length;
        }
        // Insertar identificaciones
        if (identificaciones.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE IDENTIFICACIONES (${identificaciones.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO identificaciones (id, tipo, numero, vigente, filtroId) VALUES\n`;
            const idValues = identificaciones.map(ident => `(${ident.id}, ${escapeSQL(ident.tipo)}, ${escapeSQL(ident.numero)}, ${escapeSQL(ident.vigente)}, ${ident.filtro?.id || 'NULL'})`).join(',\n');
            sqlContent += idValues + ';\n\n';
            totalRegistros += identificaciones.length;
        }
        // Insertar TIAS
        if (tias.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE TIAS (${tias.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO tias (id, tipo, estado, filtroId, fechaCreacion, fechaActualizacion) VALUES\n`;
            const tiasValues = tias.map(tias => `(${escapeSQL(tias.id)}, ${escapeSQL(tias.tipo)}, ${escapeSQL(tias.estado)}, ${tias.filtro?.id || 'NULL'}, ${escapeSQL(tias.fechaCreacion)}, ${escapeSQL(tias.fechaActualizacion)})`).join(',\n');
            sqlContent += tiasValues + ';\n\n';
            totalRegistros += tias.length;
        }
        // Insertar turnos
        if (turnos.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE TURNOS (${turnos.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO turnos (id, nombreTurno, horaInicio, horaFin, estaActivo, creadoPor, fechaCreacion, fechaActualizacion) VALUES\n`;
            const turnoValues = turnos.map(turno => `(${turno.id}, ${escapeSQL(turno.nombreTurno)}, ${escapeSQL(turno.horaInicio)}, ${escapeSQL(turno.horaFin)}, ${escapeSQL(turno.estaActivo)}, ${turno.creadoPor}, ${escapeSQL(turno.fechaCreacion)}, ${escapeSQL(turno.fechaActualizacion)})`).join(',\n');
            sqlContent += turnoValues + ';\n\n';
            totalRegistros += turnos.length;
        }
        // Insertar filtros
        if (filtros.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE FILTROS (${filtros.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO filtros (id, nombre, descripcion, ubicacion, cantidad, estaActivo, usuarioCreadorId) VALUES\n`;
            const filtroValues = filtros.map(filtro => `(${filtro.id}, ${escapeSQL(filtro.nombre)}, ${escapeSQL(filtro.descripcion)}, ${escapeSQL(filtro.ubicacion)}, ${filtro.cantidad || 'NULL'}, ${escapeSQL(filtro.estaActivo)}, ${filtro.usuarioCreadorId || 'NULL'})`).join(',\n');
            sqlContent += filtroValues + ';\n\n';
            totalRegistros += filtros.length;
        }
        // Insertar accesos
        if (accesos.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE ACCESOS (${accesos.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO accesos (id, nombre, apellidos, telefono, empresa, motivo, area, registradoPor, identificacionId, tiasId, creadoPor, turnoId, filtroId, tieneAcompanante, nombreAcompanante, direccionAcompanante, conGrupo, cantidadGrupo, horaEntrada, horaSalida, fechaCreacion, fechaActualizacion) VALUES\n`;
            const accesoValues = accesos.map(acceso => `(${acceso.id}, ${escapeSQL(acceso.nombre)}, ${escapeSQL(acceso.apellidos)}, ${escapeSQL(acceso.telefono)}, ${escapeSQL(acceso.empresa)}, ${escapeSQL(acceso.motivo)}, ${escapeSQL(acceso.area)}, ${escapeSQL(acceso.registradoPor)},${acceso.identificacionId || 'NULL'}, ${acceso.tiasId ? escapeSQL(acceso.tiasId) : 'NULL'}, ${acceso.creadoPor}, ${acceso.turnoId || 'NULL'}, ${acceso.filtroId || 'NULL'}, ${escapeSQL(acceso.tieneAcompanante)}, ${escapeSQL(acceso.nombreAcompanante)}, ${escapeSQL(acceso.direccionAcompanante)}, ${escapeSQL(acceso.conGrupo)}, ${acceso.cantidadGrupo || 'NULL'}, ${escapeSQL(acceso.horaEntrada)}, ${escapeSQL(acceso.horaSalida)}, ${escapeSQL(acceso.fechaCreacion)}, ${escapeSQL(acceso.fechaActualizacion)})`).join(',\n');
            sqlContent += accesoValues + ';\n\n';
            totalRegistros += accesos.length;
        }
        // Insertar turnoUsuario
        if (turnoUsuario.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE TURNO_USUARIOS (${turnoUsuario.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO turnoUsuario (id, turnoId, usuarioId, fechaAsignacion) VALUES\n`;
            const turnoUserValues = turnoUsuario.map(tu => `(${tu.id}, ${tu.turnoId}, ${tu.usuarioId}, ${escapeSQL(tu.fechaAsignacion)})`).join(',\n');
            sqlContent += turnoUserValues + ';\n\n';
            totalRegistros += turnoUsuario.length;
        }
        // Insertar backup_logs
        if (backupLogs.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE BACKUP_LOGS (${backupLogs.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO backup_logs (id, tipo, descripcion, usuarioId, detalles, fechaCreacion) VALUES\n`;
            const backupValues = backupLogs.map(backup => `(${backup.id}, ${escapeSQL(backup.tipo)}, ${escapeSQL(backup.descripcion)}, ${backup.usuarioId}, ${escapeSQL(backup.detalles)}, ${escapeSQL(backup.fechaCreacion)})`).join(',\n');
            sqlContent += backupValues + ';\n\n';
            totalRegistros += backupLogs.length;
        }
        // Insertar auditoria
        if (auditorias.length > 0) {
            sqlContent += `-- =============================================\n`;
            sqlContent += `-- DATOS DE AUDITORIA (${auditorias.length} registros)\n`;
            sqlContent += `-- =============================================\n`;
            sqlContent += `INSERT IGNORE INTO auditoria (id, tipo, accion, descripcion, usuarioId, accesoId, turnoId, identificacionId, filtroId, tiasId, fechaCreacion) VALUES\n`;
            const auditoriaValues = auditorias.map(audit => `(${audit.id}, ${escapeSQL(audit.tipo)}, ${escapeSQL(audit.accion)}, ${escapeSQL(audit.descripcion)}, ${audit.usuarioId || 'NULL'}, ${audit.accesoId || 'NULL'}, ${audit.turnoId || 'NULL'}, ${audit.identificacionId || 'NULL'}, ${audit.filtroId || 'NULL'}, ${audit.tiasId ? escapeSQL(audit.tiasId) : 'NULL'}, ${escapeSQL(audit.fechaCreacion)})`).join(',\n');
            sqlContent += auditoriaValues + ';\n\n';
            totalRegistros += auditorias.length;
        }
        return { sql: sqlContent, totalRegistros };
    }
    static importarDB = async (req, res) => {
        try {
            const { modo, conflictos, validarDatos, crearBackup } = req.body;
            const usuario = req.user;
            const archivo = req.file;
            if (!['SUPERADMIN', 'ADMINISTRADOR'].includes(usuario.rol)) {
                return res.status(403).json({ error: 'No autorizado para realizar importaciones' });
            }
            if (!archivo) {
                return res.status(400).json({ error: 'No se proporcionó archivo' });
            }
            const getSafeExtension = (filename) => {
                const parts = filename.split('.');
                return parts.length > 1 ? parts.pop().toLowerCase() : 'desconocido';
            };
            const extension = getSafeExtension(archivo.originalname);
            if (!['json', 'sql'].includes(extension)) {
                return res.status(400).json({ error: 'Formato de archivo no soportado. Use .json o .sql' });
            }
            // Crear backup automático si se solicita
            if (crearBackup) {
                await BackupController.crearBackupAutomatico(usuario.id);
            }
            // Procesar importación según el formato
            let resultado;
            if (extension === 'json') {
                resultado = await BackupController.importarDesdeJSON(archivo, modo, conflictos);
            }
            else if (extension === 'sql') {
                resultado = await BackupController.importarDesdeSQL(archivo);
            }
            // Guardar log de importación
            const backupLog = await data_1.prisma.backupLog.create({
                data: {
                    tipo: 'IMPORTACION',
                    descripcion: `Importación ${extension.toUpperCase()} - ${archivo.originalname}`,
                    usuarioId: usuario.id,
                    detalles: {
                        modo,
                        conflictos,
                        archivo: archivo.originalname,
                        resultado,
                        tamaño: archivo.size
                    }
                }
            });
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'SISTEMA',
                    accion: 'IMPORTACIÓN_BD',
                    descripcion: `Usuario ${usuario.id} importó BD desde archivo ${extension}`,
                    usuarioId: usuario.id
                }
            });
            console.log('Importación registrada en backup_logs:', backupLog.id);
            res.json({
                success: true,
                message: `Importación ${extension.toUpperCase()} completada correctamente`,
                detalles: resultado,
                formato: extension
            });
        }
        catch (error) {
            console.error('Error en importación:', error);
            await data_1.prisma.backupLog.create({
                data: {
                    tipo: 'IMPORTACION',
                    descripcion: 'Error en importación',
                    usuarioId: req.user.id,
                    detalles: {
                        error: error instanceof Error ? error.message : 'Error desconocido',
                        archivo: req.file?.originalname
                    }
                }
            });
            res.status(500).json({
                success: false,
                error: 'Error durante la importación'
            });
        }
    };
    static async importarDesdeSQL(archivo) {
        try {
            const sqlContent = archivo.buffer.toString();
            // Validar que es un archivo SQL válido
            if (!sqlContent.includes('INSERT') && !sqlContent.includes('CREATE')) {
                throw new Error('Archivo SQL no válido: no contiene sentencias INSERT o CREATE');
            }
            let registrosProcesados = 0;
            const queries = sqlContent.split(';').filter(query => query.trim().length > 0);
            // Ejecutar cada consulta SQL
            for (const query of queries) {
                if (query.trim()) {
                    try {
                        // Para INSERT queries, contar registros
                        if (query.trim().toUpperCase().startsWith('INSERT')) {
                            const result = await data_1.prisma.$executeRawUnsafe(query);
                            registrosProcesados += typeof result === 'number' ? result : 1;
                        }
                        else {
                            // Ejecutar otras consultas (CREATE, etc.)
                            await data_1.prisma.$executeRawUnsafe(query);
                        }
                    }
                    catch (queryError) {
                        console.warn(`Error ejecutando query: ${queryError}`);
                        // Continuar con las siguientes queries
                    }
                }
            }
            return {
                registrosProcesados,
                queriesEjecutadas: queries.length,
                mensaje: 'Importación SQL completada'
            };
        }
        catch (error) {
            throw new Error(`Error procesando archivo SQL: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    static async importarDesdeJSON(archivo, modo, conflictos) {
        try {
            const datos = JSON.parse(archivo.buffer.toString());
            if (!datos.metadata || !datos.datos) {
                throw new Error('Archivo JSON inválido: falta metadata o datos');
            }
            let registrosProcesados = 0;
            // Procesar usuarios
            if (datos.datos.usuarios) {
                for (const usuario of datos.datos.usuarios) {
                    await data_1.prisma.usuario.upsert({
                        where: { email: usuario.email },
                        update: conflictos === 'reemplazar' ? usuario : {},
                        create: usuario
                    });
                    registrosProcesados++;
                }
            }
            // Procesar identificaciones
            if (datos.datos.identificaciones) {
                for (const identificacion of datos.datos.identificaciones) {
                    if (identificacion.numero) {
                        await data_1.prisma.identificacion.upsert({
                            where: { numero: identificacion.numero },
                            update: conflictos === 'reemplazar' ? identificacion : {},
                            create: identificacion
                        });
                        registrosProcesados++;
                    }
                    else {
                        // Si no tiene número, crear nuevo
                        await data_1.prisma.identificacion.create({
                            data: identificacion
                        });
                        registrosProcesados++;
                    }
                }
            }
            // Procesar TIAS
            if (datos.datos.tias) {
                for (const tias of datos.datos.tias) {
                    await data_1.prisma.tIAS.upsert({
                        where: { id: tias.id },
                        update: conflictos === 'reemplazar' ? tias : {},
                        create: tias
                    });
                    registrosProcesados++;
                }
            }
            // Procesar filtros
            if (datos.datos.filtros) {
                for (const filtro of datos.datos.filtros) {
                    await data_1.prisma.filtro.upsert({
                        where: { nombre: filtro.nombre },
                        update: conflictos === 'reemplazar' ? filtro : {},
                        create: filtro
                    });
                    registrosProcesados++;
                }
            }
            // Procesar backup logs si existen
            if (datos.datos.backupLogs) {
                for (const backupLog of datos.datos.backupLogs) {
                    await data_1.prisma.backupLog.create({
                        data: {
                            tipo: backupLog.tipo,
                            descripcion: backupLog.descripcion,
                            usuarioId: backupLog.usuarioId,
                            detalles: backupLog.detalles,
                            fechaCreacion: new Date(backupLog.fechaCreacion)
                        }
                    });
                    registrosProcesados++;
                }
            }
            return {
                registrosProcesados,
                tablas: Object.keys(datos.datos).filter(key => Array.isArray(datos.datos[key]))
            };
        }
        catch (error) {
            throw new Error(`Error procesando archivo JSON: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    static async crearBackupAutomatico(usuarioId) {
        try {
            const datos = await BackupController.exportarSQL(true, true, {});
            await data_1.prisma.backupLog.create({
                data: {
                    tipo: 'BACKUP_AUTO',
                    descripcion: 'Backup automático pre-importación',
                    usuarioId,
                    detalles: {
                        estadisticas: {
                            totalRegistros: Object.values(datos.datos).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0)
                        }
                    }
                }
            });
            console.log('Backup automático creado para usuario:', usuarioId);
        }
        catch (error) {
            console.error('Error creando backup automático:', error);
        }
    }
    static getHistorial = async (req, res) => {
        try {
            const { page = 1, limit = 10, tipo } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (tipo && tipo !== 'all') {
                where.tipo = tipo;
            }
            const [logs, total] = await Promise.all([
                data_1.prisma.backupLog.findMany({
                    where,
                    include: {
                        usuario: {
                            select: { nombre: true, apellidos: true, email: true }
                        }
                    },
                    orderBy: { fechaCreacion: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                data_1.prisma.backupLog.count({ where })
            ]);
            res.json({
                logs,
                total,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page)
            });
        }
        catch (error) {
            console.error('Error obteniendo historial:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static getEstadisticasBackups = async (req, res) => {
        try {
            const [totalExportaciones, totalImportaciones, totalBackupsAuto, ultimoBackup] = await Promise.all([
                data_1.prisma.backupLog.count({ where: { tipo: 'EXPORTACION' } }),
                data_1.prisma.backupLog.count({ where: { tipo: 'IMPORTACION' } }),
                data_1.prisma.backupLog.count({ where: { tipo: 'BACKUP_AUTO' } }),
                data_1.prisma.backupLog.findFirst({
                    where: { tipo: 'EXPORTACION' },
                    orderBy: { fechaCreacion: 'desc' },
                    select: { fechaCreacion: true, usuario: { select: { nombre: true, apellidos: true } } }
                })
            ]);
            res.json({
                totalExportaciones,
                totalImportaciones,
                totalBackupsAuto,
                ultimoBackup: ultimoBackup ? {
                    fecha: ultimoBackup.fechaCreacion,
                    usuario: `${ultimoBackup.usuario.nombre} ${ultimoBackup.usuario.apellidos}`
                } : null
            });
        }
        catch (error) {
            console.error('Error obteniendo estadísticas de backups:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
}
exports.BackupController = BackupController;
//# sourceMappingURL=backup.controller.js.map