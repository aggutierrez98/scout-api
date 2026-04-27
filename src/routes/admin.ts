import { Router, Request, Response, NextFunction } from 'express';
import { BackupService } from '../services/BackupService';
import { AppError, HttpCode } from '../utils';

const requireAdmin = (_req: Request, res: Response, next: NextFunction) => {
    if (res.locals.currentUser?.role !== 'ADMINISTRADOR') {
        return next(new AppError({
            name: 'FORBIDDEN',
            description: 'Acceso restringido a administradores',
            httpCode: HttpCode.FORBIDDEN,
        }));
    }
    next();
};

export default function createAdminRouter() {
    const router = Router();

    router.post('/backup', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
        try {
            await BackupService.exportAll();
            res.json({ success: true, message: 'Backup realizado correctamente' });
        } catch (error) {
            next(error);
        }
    });

    router.post('/restore', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
        try {
            await BackupService.importAll();
            res.json({ success: true, message: 'Restauración realizada correctamente' });
        } catch (error) {
            next(error);
        }
    });

    return router;
}
