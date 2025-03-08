import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { AuthService } from "../services/auth";
import { generateToken, verifyToken } from "../utils/lib/jwt.util";
import { NotifactionsResponse, Notification } from "../types";

export class AuthController {
    public authService;

    constructor({ authService }: { authService: AuthService }) {
        this.authService = authService;
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body
            const response = await this.authService.loginUser(data);

            if (!response) {
                throw new AppError({
                    name: "INVALID_CREDENTIALS",
                    httpCode: HttpCode.BAD_REQUEST,
                    description: "Credenciales incorrectas"
                });
            }
            // req.session.user = { id: data.id, username: data.username };
            res.send(response);
        } catch (e) {
            next(e);
        }
    };

    firstLogin = async ({ body }: Request, res: Response, next: NextFunction) => {
        try {
            const { username, password } = body;
            const user = await this.authService.getUser({ username: username?.toString(), hasLoggedIn: false });
            if (!user) {
                throw new AppError({
                    name: "NOT_VALID_USER",
                    httpCode: HttpCode.UNAUTHORIZED,
                    description: "El usuario no es valido"
                });
            }
            const response = await this.authService.modifyUser({ userId: user.id, password });
            res.send(response);
        } catch (e) {
            next(e);
        }
    };

    register = async ({ body }: Request, res: Response, next: NextFunction) => {
        try {
            const response = await this.authService.createUser(body);
            res.send(response);
        } catch (e) {
            next(e);
        }
    };

    modify = async ({ body, params }: Request, res: Response, next: NextFunction) => {
        try {
            const { active, role } = body;
            const userId = params.id

            const response = await this.authService.modifyUser({ userId, active, role });
            res.send(response);
        } catch (e) {
            next(e);
        }
    };

    renew = async ({ headers }: Request, res: Response, next: NextFunction) => {
        try {
            const jwtFromHeader = headers.authorization?.split("Bearer ")[1]?.split(" ").pop()

            if (jwtFromHeader) {
                let userId;
                let token;
                try {
                    userId = (verifyToken(`${jwtFromHeader}`) as { id: string }).id;
                    token = generateToken(userId)
                } catch (error) {
                    throw new AppError({
                        name: "INVALID_TOKEN",
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: "Token invalido"
                    });
                }

                const user = await this.authService.getUser({ userId })

                if (!user) {
                    throw new AppError({
                        name: "INVALID_TOKEN",
                        httpCode: HttpCode.UNAUTHORIZED,
                        description: "Token invalido"
                    });
                }

                res.json({
                    token,
                    id: user.id,
                    role: user.role,
                    scout: user.scout,
                    familiar: user.familiar,
                    username: user.username
                })
            }
        } catch (e) {
            next(e)
        }
    }

    getMe = async (_: Request, res: Response, next: NextFunction) => {
        try {
            const user = res.locals.currentUser

            if (!user) {
                throw new AppError({
                    name: "NOT_VALID_USER",
                    httpCode: HttpCode.UNAUTHORIZED,
                    description: "Usuario inexistente"
                });
            }

            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                scout: user.scout,
                familiar: user.familiar
            })
        } catch (e) {
            next(e)
        }
    }

    getNotifications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = res.locals.currentUser

            const { offset, limit, orderBy } = req.query;

            // const response = await this.authService.getNotifications({
            //     limit: limit ? Number(limit) : undefined,
            //     offset: offset ? Number(offset) : undefined,
            //     // orderBy
            // });

            if (!user) {
                throw new AppError({
                    name: "NOT_VALID_USER",
                    httpCode: HttpCode.UNAUTHORIZED,
                    description: "Usuario inexistente"
                });
            }

            const notifications: Notification[] = [
                // { id: "1", message: "Tuvieja", read: false },
                // { id: "2", message: "Hola", read: false },
            ]
            const unreadCount = notifications.filter(notification => !notification.read).length

            res.json({ notifications, unreadCount })
        } catch (e) {
            next(e)
        }
    }

    getItems = async ({ query }: Request, res: Response, next: NextFunction) => {
        try {
            const { offset, limit, orderBy, ...filters } = query;

            const response = await this.authService.getUsers({
                limit: limit ? Number(limit) : undefined,
                offset: offset ? Number(offset) : undefined,
                filters,
            });

            res.send(response);
        } catch (e) {
            next(e);
        }
    }


    getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = params;
            const response = await this.authService.getUser({ userId: id });
            res.send(response);
        } catch (e) {
            next(e);
        }
    }

    // // renewToken = async ({ body }: Request, res: Response, next: NextFunction) => {
    // //     try {
    // //         const response = await this.authService.loginUser(body);

    // //         if (!response) {
    // //             throw new AppError({
    // //                 name: "INVALID_CREDENTIALS",
    // //                 httpCode: HttpCode.BAD_REQUEST,
    // //                 description: "Credenciales incorrectas"
    // //             });
    // //         }

    // //         res.send(response);
    // //     } catch (e) {
    // //         next(e);
    // //     }
    // // };
}
