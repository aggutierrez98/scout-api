import { Router } from "express";
import { AuthController } from "../controllers/auth";
import { validate } from "../middlewares/validate";
import {
    GetUserSchema,
    GetUsersSchema,
    LoginSchema,
    ModifySchema,
    RegisterSchema,
    FirstLoginSchema
} from "../validators/auth";
import { AuthService } from "../services/auth";
import { checkSession } from "../middlewares";

export default function createAuthRouter(authService: AuthService) {
    const router = Router();
    const authController = new AuthController({ authService });
    router.get("/renew", checkSession, authController.renew);
    router.get("/me", checkSession, authController.getMe);
    router.get("/notifications", checkSession, authController.getNotifications);
    router.get("/users", checkSession, validate(GetUsersSchema), authController.getItems);
    router.get("/users/:id", checkSession, validate(GetUserSchema), authController.getItem);
    router.post("/", validate(LoginSchema), authController.login);
    router.post("/create", checkSession, validate(RegisterSchema), authController.register);
    router.put("/firstLogin", validate(FirstLoginSchema), authController.firstLogin);
    router.put("/:id", checkSession, validate(ModifySchema), authController.modify);
    return router;
};
