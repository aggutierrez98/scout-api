import { readBackupSheet, writeBackupSheet } from '../utils/helpers/googleDriveApi';
import { prismaClient as prisma } from '../utils/lib/prisma-client';
import logger from '../utils/classes/Logger';

const toStr = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val.toISOString();
    return String(val);
};

const SHEETS = {
    USUARIOS: 'usuarios',
    FAMILIARES: 'familiares',
    EQUIPOS: 'equipos',
    TIPOS_EVENTO: 'tipos-evento',
    SCOUTS: 'scouts',
    FAMILIAR_SCOUT: 'familiar-scout',
    DOCS_DATA: 'docs-data',
    DOCUMENTOS: 'documentos',
    CICLOS_REGLAS: 'ciclos-reglas',
    REGLAS_AFILIACION: 'reglas-afiliacion',
    REGLAS_CUOTA: 'reglas-cuota-mensual',
    REGLAS_DESCUENTO_ANUAL: 'reglas-descuento-anual',
    REGLAS_DESCUENTO_FAMILIAR: 'reglas-descuento-familiar',
    PAGOS: 'pagos',
    RECIBOS: 'recibos',
    ENTREGAS: 'entregas',
    PUSH_TOKENS: 'push-tokens',
    EVENTOS: 'eventos',
    EVENTO_PARTICIPANTES: 'evento-participantes',
} as const;

export class BackupService {
    static async exportAll(): Promise<void> {
        logger.info('[BackupService] Iniciando exportación de todos los datos...');

        const [
            usuarios,
            familiares,
            equipos,
            tiposEvento,
            scouts,
            familiarScouts,
            documentosDefs,
            documentosPresentados,
            ciclosReglas,
            reglasAfiliacion,
            reglasCuota,
            reglasDescuentoAnual,
            reglasDescuentoFamiliar,
            pagos,
            recibos,
            entregas,
            pushTokens,
            eventos,
            eventoParticipantes,
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.familiar.findMany(),
            prisma.equipo.findMany(),
            prisma.tipoEvento.findMany(),
            prisma.scout.findMany({ include: { user: { select: { uuid: true } } } }),
            prisma.familiarScout.findMany(),
            prisma.documento.findMany(),
            prisma.documentoPresentado.findMany(),
            prisma.cicloReglasPago.findMany(),
            prisma.reglaAfiliacion.findMany(),
            prisma.reglaCuotaMensual.findMany(),
            prisma.reglaDescuentoPagoAnual.findMany(),
            prisma.reglaDescuentoFamiliar.findMany(),
            prisma.pago.findMany(),
            prisma.reciboPago.findMany(),
            prisma.entregaRealizada.findMany(),
            prisma.pushToken.findMany(),
            prisma.evento.findMany(),
            prisma.eventoParticipante.findMany(),
        ]);

        await writeBackupSheet(SHEETS.USUARIOS, usuarios.map(u => ({
            uuid: u.uuid,
            username: u.username,
            password: toStr(u.password),
            role: u.role,
            active: toStr(u.active),
            scoutId: toStr(u.scoutId),
            familiarId: toStr(u.familiarId),
        })));

        await writeBackupSheet(SHEETS.FAMILIARES, familiares.map(f => ({
            uuid: f.uuid,
            nombre: f.nombre,
            apellido: f.apellido,
            fechaNacimiento: toStr(f.fechaNacimiento),
            dni: f.dni,
            sexo: toStr(f.sexo),
            localidad: f.localidad,
            direccion: f.direccion,
            codigoPostal: toStr(f.codigoPostal),
            mail: toStr(f.mail),
            telefono: toStr(f.telefono),
            nacionalidad: toStr(f.nacionalidad),
            provincia: toStr(f.provincia),
            estadoCivil: toStr(f.estadoCivil),
        })));

        await writeBackupSheet(SHEETS.EQUIPOS, equipos.map(e => ({
            uuid: e.uuid,
            nombre: e.nombre,
            lema: toStr(e.lema),
            rama: e.rama,
        })));

        await writeBackupSheet(SHEETS.TIPOS_EVENTO, tiposEvento.map(t => ({
            uuid: t.uuid,
            nombre: t.nombre,
            activo: toStr(t.activo),
        })));

        await writeBackupSheet(SHEETS.SCOUTS, scouts.map(s => ({
            uuid: s.uuid,
            nombre: s.nombre,
            apellido: s.apellido,
            fechaNacimiento: toStr(s.fechaNacimiento),
            dni: s.dni,
            sexo: toStr(s.sexo),
            localidad: s.localidad,
            direccion: s.direccion,
            codigoPostal: toStr(s.codigoPostal),
            afiliado: toStr(s.afiliado),
            telefono: toStr(s.telefono),
            nacionalidad: toStr(s.nacionalidad),
            provincia: toStr(s.provincia),
            mail: toStr(s.mail),
            progresionActual: toStr(s.progresionActual),
            religion: toStr(s.religion),
            rama: toStr(s.rama),
            equipoId: toStr(s.equipoId),
            funcion: toStr(s.funcion),
            estado: toStr(s.estado),
            userId: toStr(s.user?.uuid),
        })));

        await writeBackupSheet(SHEETS.FAMILIAR_SCOUT, familiarScouts.map(r => ({
            id: toStr(r.id),
            familiarId: r.familiarId,
            scoutId: r.scoutId,
            relacion: r.relacion,
        })));

        await writeBackupSheet(SHEETS.DOCS_DATA, documentosDefs.map(d => ({
            uuid: d.uuid,
            nombre: d.nombre,
            requiereRenovacionAnual: toStr(d.requiereRenovacionAnual),
            requeridoParaIngreso: toStr(d.requeridoParaIngreso),
            completableDinamicamente: toStr(d.completableDinamicamente),
            googleDriveFileId: toStr(d.googleDriveFileId),
            requiereDatosFamiliar: toStr(d.requiereDatosFamiliar),
            requiereFirmaFamiliar: toStr(d.requiereFirmaFamiliar),
        })));

        await writeBackupSheet(SHEETS.DOCUMENTOS, documentosPresentados.map(d => ({
            uuid: d.uuid,
            documentoId: d.documentoId,
            scoutId: toStr(d.scoutId),
            familiarId: toStr(d.familiarId),
            uploadId: toStr(d.uploadId),
            fechaPresentacion: toStr(d.fechaPresentacion),
        })));

        await writeBackupSheet(SHEETS.CICLOS_REGLAS, ciclosReglas.map(c => ({
            uuid: c.uuid,
            anio: toStr(c.anio),
            activo: toStr(c.activo),
            fechaInicio: toStr(c.fechaInicio),
            fechaFin: toStr(c.fechaFin),
        })));

        await writeBackupSheet(SHEETS.REGLAS_AFILIACION, reglasAfiliacion.map(r => ({
            uuid: r.uuid,
            cicloId: r.cicloId,
            funcionScout: r.funcionScout,
            monto: toStr(r.monto),
            obligatoria: toStr(r.obligatoria),
        })));

        await writeBackupSheet(SHEETS.REGLAS_CUOTA, reglasCuota.map(r => ({
            uuid: r.uuid,
            cicloId: r.cicloId,
            mes: toStr(r.mes),
            montoBase: toStr(r.montoBase),
            cobrable: toStr(r.cobrable),
        })));

        await writeBackupSheet(SHEETS.REGLAS_DESCUENTO_ANUAL, reglasDescuentoAnual.map(r => ({
            uuid: r.uuid,
            cicloId: r.cicloId,
            habilitado: toStr(r.habilitado),
            mesBonificado: toStr(r.mesBonificado),
        })));

        await writeBackupSheet(SHEETS.REGLAS_DESCUENTO_FAMILIAR, reglasDescuentoFamiliar.map(r => ({
            uuid: r.uuid,
            cicloId: r.cicloId,
            cantidadMinima: toStr(r.cantidadMinima),
            cantidadMaxima: toStr(r.cantidadMaxima),
            montoPorScout: toStr(r.montoPorScout),
        })));

        await writeBackupSheet(SHEETS.PAGOS, pagos.map(p => ({
            uuid: p.uuid,
            scoutId: p.scoutId,
            concepto: p.concepto,
            monto: toStr(p.monto),
            rendido: toStr(p.rendido),
            metodoPago: p.metodoPago,
            fechaPago: toStr(p.fechaPago),
        })));

        await writeBackupSheet(SHEETS.RECIBOS, recibos.map(r => ({
            uuid: r.uuid,
            numeroRecibo: toStr(r.numeroRecibo),
            pagoId: r.pagoId,
            uploadPath: toStr(r.uploadPath),
        })));

        await writeBackupSheet(SHEETS.ENTREGAS, entregas.map(e => ({
            uuid: e.uuid,
            scoutId: e.scoutId,
            tipoEntrega: e.tipoEntrega,
            fechaEntrega: toStr(e.fechaEntrega),
        })));

        await writeBackupSheet(SHEETS.PUSH_TOKENS, pushTokens.map(t => ({
            uuid: t.uuid,
            userId: t.userId,
            platform: t.platform,
            token: t.token,
            active: toStr(t.active),
        })));

        await writeBackupSheet(SHEETS.EVENTOS, eventos.map(e => ({
            uuid: e.uuid,
            nombre: e.nombre,
            descripcion: e.descripcion,
            tipoEventoId: e.tipoEventoId,
            lugarNombre: toStr(e.lugarNombre),
            lugarDireccion: e.lugarDireccion,
            lugarLocalidad: e.lugarLocalidad,
            lugarPartido: e.lugarPartido,
            lugarProvincia: e.lugarProvincia,
            lugarLatitud: toStr(e.lugarLatitud),
            lugarLongitud: toStr(e.lugarLongitud),
            centroSaludCercanoNombre: toStr(e.centroSaludCercanoNombre),
            centroSaludCercanoDireccion: toStr(e.centroSaludCercanoDireccion),
            centroSaludCercanoLocalidad: toStr(e.centroSaludCercanoLocalidad),
            comisariaCercanaNombre: toStr(e.comisariaCercanaNombre),
            comisariaCercanaDireccion: toStr(e.comisariaCercanaDireccion),
            comisariaCercanaLocalidad: toStr(e.comisariaCercanaLocalidad),
            fechaHoraInicio: toStr(e.fechaHoraInicio),
            fechaHoraFin: toStr(e.fechaHoraFin),
            costo: toStr(e.costo),
            activo: toStr(e.activo),
        })));

        await writeBackupSheet(SHEETS.EVENTO_PARTICIPANTES, eventoParticipantes.map(p => ({
            uuid: p.uuid,
            eventoId: p.eventoId,
            scoutId: p.scoutId,
            tipoParticipante: p.tipoParticipante,
        })));

        logger.info('[BackupService] Exportación completada.');
    }

    static async importAll(): Promise<void> {
        logger.info('[BackupService] Iniciando restauración desde backup...');

        const [
            usuariosRows,
            familiaresRows,
            equiposRows,
            tiposEventoRows,
            scoutsRows,
            familiarScoutRows,
            docsDataRows,
            documentosRows,
            ciclosRows,
            reglasAfiliacionRows,
            reglasCuotaRows,
            reglasDescAnualRows,
            reglasDescFamiliarRows,
            pagosRows,
            recibosRows,
            entregasRows,
            pushTokensRows,
            eventosRows,
            eventoParticipantesRows,
        ] = await Promise.all([
            readBackupSheet(SHEETS.USUARIOS),
            readBackupSheet(SHEETS.FAMILIARES),
            readBackupSheet(SHEETS.EQUIPOS),
            readBackupSheet(SHEETS.TIPOS_EVENTO),
            readBackupSheet(SHEETS.SCOUTS),
            readBackupSheet(SHEETS.FAMILIAR_SCOUT),
            readBackupSheet(SHEETS.DOCS_DATA),
            readBackupSheet(SHEETS.DOCUMENTOS),
            readBackupSheet(SHEETS.CICLOS_REGLAS),
            readBackupSheet(SHEETS.REGLAS_AFILIACION),
            readBackupSheet(SHEETS.REGLAS_CUOTA),
            readBackupSheet(SHEETS.REGLAS_DESCUENTO_ANUAL),
            readBackupSheet(SHEETS.REGLAS_DESCUENTO_FAMILIAR),
            readBackupSheet(SHEETS.PAGOS),
            readBackupSheet(SHEETS.RECIBOS),
            readBackupSheet(SHEETS.ENTREGAS),
            readBackupSheet(SHEETS.PUSH_TOKENS),
            readBackupSheet(SHEETS.EVENTOS),
            readBackupSheet(SHEETS.EVENTO_PARTICIPANTES),
        ]);

        // 1. Equipos
        for (const row of equiposRows) {
            await prisma.equipo.upsert({
                where: { uuid: row.uuid },
                create: { uuid: row.uuid, nombre: row.nombre, lema: row.lema || null, rama: row.rama },
                update: { nombre: row.nombre, lema: row.lema || null, rama: row.rama },
            });
        }

        // 2. Familiares
        for (const row of familiaresRows) {
            await prisma.familiar.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    nombre: row.nombre,
                    apellido: row.apellido,
                    fechaNacimiento: new Date(row.fechaNacimiento),
                    dni: row.dni,
                    sexo: row.sexo || null,
                    localidad: row.localidad,
                    direccion: row.direccion,
                    codigoPostal: row.codigoPostal || null,
                    mail: row.mail || null,
                    telefono: row.telefono || null,
                    nacionalidad: row.nacionalidad || null,
                    provincia: row.provincia || null,
                    estadoCivil: row.estadoCivil || null,
                },
                update: {
                    nombre: row.nombre,
                    apellido: row.apellido,
                    fechaNacimiento: new Date(row.fechaNacimiento),
                    dni: row.dni,
                    sexo: row.sexo || null,
                    localidad: row.localidad,
                    direccion: row.direccion,
                    codigoPostal: row.codigoPostal || null,
                    mail: row.mail || null,
                    telefono: row.telefono || null,
                    nacionalidad: row.nacionalidad || null,
                    provincia: row.provincia || null,
                    estadoCivil: row.estadoCivil || null,
                },
            });
        }

        // 3. Usuarios (sin FK links a scout/familiar aún)
        for (const row of usuariosRows) {
            await prisma.user.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    username: row.username,
                    password: row.password || null,
                    role: row.role,
                    active: row.active === 'true',
                },
                update: {
                    username: row.username,
                    password: row.password || null,
                    role: row.role,
                    active: row.active === 'true',
                },
            });
        }

        // 4. Link usuarios → familiares (familiares ya existen)
        for (const row of usuariosRows) {
            if (row.familiarId) {
                await prisma.user.update({
                    where: { uuid: row.uuid },
                    data: { familiarId: row.familiarId },
                }).catch(() => {
                    logger.warn(`[BackupService] No se pudo vincular usuario ${row.uuid} a familiar ${row.familiarId}`);
                });
            }
        }

        // 5. Tipos de evento
        for (const row of tiposEventoRows) {
            await prisma.tipoEvento.upsert({
                where: { uuid: row.uuid },
                create: { uuid: row.uuid, nombre: row.nombre, activo: row.activo === 'true' },
                update: { nombre: row.nombre, activo: row.activo === 'true' },
            });
        }

        // 6. Scouts + link usuarios → scouts
        for (const row of scoutsRows) {
            await prisma.scout.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    nombre: row.nombre,
                    apellido: row.apellido,
                    fechaNacimiento: new Date(row.fechaNacimiento),
                    dni: row.dni,
                    sexo: row.sexo || null,
                    localidad: row.localidad,
                    direccion: row.direccion,
                    codigoPostal: row.codigoPostal || null,
                    afiliado: row.afiliado === 'true',
                    telefono: row.telefono || null,
                    nacionalidad: row.nacionalidad || null,
                    provincia: row.provincia || null,
                    mail: row.mail || null,
                    progresionActual: (row.progresionActual as any) || null,
                    religion: row.religion || null,
                    rama: (row.rama as any) || null,
                    equipoId: row.equipoId || null,
                    funcion: row.funcion || null,
                    estado: row.estado || null,
                },
                update: {
                    nombre: row.nombre,
                    apellido: row.apellido,
                    fechaNacimiento: new Date(row.fechaNacimiento),
                    dni: row.dni,
                    sexo: row.sexo || null,
                    localidad: row.localidad,
                    direccion: row.direccion,
                    codigoPostal: row.codigoPostal || null,
                    afiliado: row.afiliado === 'true',
                    telefono: row.telefono || null,
                    nacionalidad: row.nacionalidad || null,
                    provincia: row.provincia || null,
                    mail: row.mail || null,
                    progresionActual: (row.progresionActual as any) || null,
                    religion: row.religion || null,
                    rama: (row.rama as any) || null,
                    equipoId: row.equipoId || null,
                    funcion: row.funcion || null,
                    estado: row.estado || null,
                },
            });

            if (row.userId) {
                await prisma.user.update({
                    where: { uuid: row.userId },
                    data: { scoutId: row.uuid },
                }).catch(() => {
                    logger.warn(`[BackupService] No se pudo vincular usuario ${row.userId} a scout ${row.uuid}`);
                });
            }
        }

        // 7. FamiliarScout (relaciones scout-familiar)
        for (const row of familiarScoutRows) {
            const existing = await prisma.familiarScout.findFirst({
                where: { familiarId: row.familiarId, scoutId: row.scoutId },
            });
            if (existing) {
                await prisma.familiarScout.update({
                    where: { id: existing.id },
                    data: { relacion: row.relacion },
                });
            } else {
                await prisma.familiarScout.create({
                    data: { familiarId: row.familiarId, scoutId: row.scoutId, relacion: row.relacion },
                });
            }
        }

        // 8. Documentos definiciones
        for (const row of docsDataRows) {
            await prisma.documento.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    nombre: row.nombre,
                    requiereRenovacionAnual: row.requiereRenovacionAnual === 'true',
                    requeridoParaIngreso: row.requeridoParaIngreso === 'true',
                    completableDinamicamente: row.completableDinamicamente === 'true',
                    googleDriveFileId: row.googleDriveFileId || null,
                    requiereDatosFamiliar: row.requiereDatosFamiliar === 'true',
                    requiereFirmaFamiliar: row.requiereFirmaFamiliar === 'true',
                },
                update: {
                    nombre: row.nombre,
                    requiereRenovacionAnual: row.requiereRenovacionAnual === 'true',
                    requeridoParaIngreso: row.requeridoParaIngreso === 'true',
                    completableDinamicamente: row.completableDinamicamente === 'true',
                    googleDriveFileId: row.googleDriveFileId || null,
                    requiereDatosFamiliar: row.requiereDatosFamiliar === 'true',
                    requiereFirmaFamiliar: row.requiereFirmaFamiliar === 'true',
                },
            });
        }

        // 9. Documentos presentados
        for (const row of documentosRows) {
            await prisma.documentoPresentado.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    documentoId: row.documentoId,
                    scoutId: row.scoutId || null,
                    familiarId: row.familiarId || null,
                    uploadId: row.uploadId || null,
                    fechaPresentacion: new Date(row.fechaPresentacion),
                },
                update: {
                    documentoId: row.documentoId,
                    scoutId: row.scoutId || null,
                    familiarId: row.familiarId || null,
                    uploadId: row.uploadId || null,
                    fechaPresentacion: new Date(row.fechaPresentacion),
                },
            });
        }

        // 10. Ciclos de reglas de pago
        for (const row of ciclosRows) {
            await prisma.cicloReglasPago.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    anio: parseInt(row.anio),
                    activo: row.activo === 'true',
                    fechaInicio: new Date(row.fechaInicio),
                    fechaFin: new Date(row.fechaFin),
                },
                update: {
                    anio: parseInt(row.anio),
                    activo: row.activo === 'true',
                    fechaInicio: new Date(row.fechaInicio),
                    fechaFin: new Date(row.fechaFin),
                },
            });
        }

        // 11. Reglas de afiliación
        for (const row of reglasAfiliacionRows) {
            await prisma.reglaAfiliacion.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    cicloId: row.cicloId,
                    funcionScout: row.funcionScout,
                    monto: parseFloat(row.monto),
                    obligatoria: row.obligatoria === 'true',
                },
                update: {
                    cicloId: row.cicloId,
                    funcionScout: row.funcionScout,
                    monto: parseFloat(row.monto),
                    obligatoria: row.obligatoria === 'true',
                },
            });
        }

        // 12. Reglas de cuota mensual
        for (const row of reglasCuotaRows) {
            await prisma.reglaCuotaMensual.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    cicloId: row.cicloId,
                    mes: parseInt(row.mes),
                    montoBase: parseFloat(row.montoBase),
                    cobrable: row.cobrable === 'true',
                },
                update: {
                    cicloId: row.cicloId,
                    mes: parseInt(row.mes),
                    montoBase: parseFloat(row.montoBase),
                    cobrable: row.cobrable === 'true',
                },
            });
        }

        // 13. Reglas de descuento anual (cicloId es unique)
        for (const row of reglasDescAnualRows) {
            await prisma.reglaDescuentoPagoAnual.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    cicloId: row.cicloId,
                    habilitado: row.habilitado === 'true',
                    mesBonificado: row.mesBonificado ? parseInt(row.mesBonificado) : null,
                },
                update: {
                    cicloId: row.cicloId,
                    habilitado: row.habilitado === 'true',
                    mesBonificado: row.mesBonificado ? parseInt(row.mesBonificado) : null,
                },
            });
        }

        // 14. Reglas de descuento familiar
        for (const row of reglasDescFamiliarRows) {
            await prisma.reglaDescuentoFamiliar.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    cicloId: row.cicloId,
                    cantidadMinima: parseInt(row.cantidadMinima),
                    cantidadMaxima: row.cantidadMaxima ? parseInt(row.cantidadMaxima) : null,
                    montoPorScout: parseFloat(row.montoPorScout),
                },
                update: {
                    cicloId: row.cicloId,
                    cantidadMinima: parseInt(row.cantidadMinima),
                    cantidadMaxima: row.cantidadMaxima ? parseInt(row.cantidadMaxima) : null,
                    montoPorScout: parseFloat(row.montoPorScout),
                },
            });
        }

        // 15. Pagos
        for (const row of pagosRows) {
            await prisma.pago.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    scoutId: row.scoutId,
                    concepto: row.concepto,
                    monto: parseFloat(row.monto),
                    rendido: row.rendido === 'true',
                    metodoPago: row.metodoPago,
                    fechaPago: new Date(row.fechaPago),
                },
                update: {
                    scoutId: row.scoutId,
                    concepto: row.concepto,
                    monto: parseFloat(row.monto),
                    rendido: row.rendido === 'true',
                    metodoPago: row.metodoPago,
                    fechaPago: new Date(row.fechaPago),
                },
            });
        }

        // 16. Recibos de pago
        for (const row of recibosRows) {
            await prisma.reciboPago.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    numeroRecibo: parseInt(row.numeroRecibo),
                    pagoId: row.pagoId,
                    uploadPath: row.uploadPath || null,
                },
                update: {
                    numeroRecibo: parseInt(row.numeroRecibo),
                    pagoId: row.pagoId,
                    uploadPath: row.uploadPath || null,
                },
            });
        }

        // 17. Entregas realizadas
        for (const row of entregasRows) {
            await prisma.entregaRealizada.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    scoutId: row.scoutId,
                    tipoEntrega: row.tipoEntrega,
                    fechaEntrega: new Date(row.fechaEntrega),
                },
                update: {
                    scoutId: row.scoutId,
                    tipoEntrega: row.tipoEntrega,
                    fechaEntrega: new Date(row.fechaEntrega),
                },
            });
        }

        // 18. Push tokens
        for (const row of pushTokensRows) {
            await prisma.pushToken.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    userId: row.userId,
                    platform: row.platform,
                    token: row.token,
                    active: row.active === 'true',
                },
                update: {
                    userId: row.userId,
                    platform: row.platform,
                    token: row.token,
                    active: row.active === 'true',
                },
            });
        }

        // 19. Eventos
        for (const row of eventosRows) {
            await prisma.evento.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    nombre: row.nombre,
                    descripcion: row.descripcion,
                    tipoEventoId: row.tipoEventoId,
                    lugarNombre: row.lugarNombre || null,
                    lugarDireccion: row.lugarDireccion,
                    lugarLocalidad: row.lugarLocalidad,
                    lugarPartido: row.lugarPartido,
                    lugarProvincia: row.lugarProvincia,
                    lugarLatitud: row.lugarLatitud ? parseFloat(row.lugarLatitud) : null,
                    lugarLongitud: row.lugarLongitud ? parseFloat(row.lugarLongitud) : null,
                    centroSaludCercanoNombre: row.centroSaludCercanoNombre || null,
                    centroSaludCercanoDireccion: row.centroSaludCercanoDireccion || null,
                    centroSaludCercanoLocalidad: row.centroSaludCercanoLocalidad || null,
                    comisariaCercanaNombre: row.comisariaCercanaNombre || null,
                    comisariaCercanaDireccion: row.comisariaCercanaDireccion || null,
                    comisariaCercanaLocalidad: row.comisariaCercanaLocalidad || null,
                    fechaHoraInicio: new Date(row.fechaHoraInicio),
                    fechaHoraFin: new Date(row.fechaHoraFin),
                    costo: row.costo ? parseFloat(row.costo) : null,
                    activo: row.activo === 'true',
                },
                update: {
                    nombre: row.nombre,
                    descripcion: row.descripcion,
                    tipoEventoId: row.tipoEventoId,
                    lugarNombre: row.lugarNombre || null,
                    lugarDireccion: row.lugarDireccion,
                    lugarLocalidad: row.lugarLocalidad,
                    lugarPartido: row.lugarPartido,
                    lugarProvincia: row.lugarProvincia,
                    lugarLatitud: row.lugarLatitud ? parseFloat(row.lugarLatitud) : null,
                    lugarLongitud: row.lugarLongitud ? parseFloat(row.lugarLongitud) : null,
                    centroSaludCercanoNombre: row.centroSaludCercanoNombre || null,
                    centroSaludCercanoDireccion: row.centroSaludCercanoDireccion || null,
                    centroSaludCercanoLocalidad: row.centroSaludCercanoLocalidad || null,
                    comisariaCercanaNombre: row.comisariaCercanaNombre || null,
                    comisariaCercanaDireccion: row.comisariaCercanaDireccion || null,
                    comisariaCercanaLocalidad: row.comisariaCercanaLocalidad || null,
                    fechaHoraInicio: new Date(row.fechaHoraInicio),
                    fechaHoraFin: new Date(row.fechaHoraFin),
                    costo: row.costo ? parseFloat(row.costo) : null,
                    activo: row.activo === 'true',
                },
            });
        }

        // 20. Participantes de eventos
        for (const row of eventoParticipantesRows) {
            await prisma.eventoParticipante.upsert({
                where: { uuid: row.uuid },
                create: {
                    uuid: row.uuid,
                    eventoId: row.eventoId,
                    scoutId: row.scoutId,
                    tipoParticipante: row.tipoParticipante,
                },
                update: {
                    eventoId: row.eventoId,
                    scoutId: row.scoutId,
                    tipoParticipante: row.tipoParticipante,
                },
            });
        }

        logger.info('[BackupService] Restauración completada.');
    }
}
