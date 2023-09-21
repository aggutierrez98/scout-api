import { NextFunction, Response, Request } from "express";
import { verifyToken } from "../utils/lib/jwt.util";
import { JwtPayload } from "jsonwebtoken";

interface RequestExt extends Request {
	user?: JwtPayload | { id: string };
}
const checkJwt = (req: RequestExt, res: Response, next: NextFunction) => {
	try {
		const jwtByUser = req.headers.authorization || "";
		const jwt = jwtByUser.split(" ").pop(); // 11111
		const isUser = verifyToken(`${jwt}`) as { id: string };
		if (!isUser) {
			res.status(401);
			res.send("NO_TIENES_UN_JWT_VALIDO");
		} else {
			req.user = isUser;
			next();
		}
	} catch (e) {
		console.log({ e });
		res.status(400);
		res.send("SESSION_NO_VALIDAD");
	}
};

export { checkJwt };
