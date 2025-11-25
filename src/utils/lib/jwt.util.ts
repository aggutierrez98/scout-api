import { sign, verify } from "jsonwebtoken";
import { SecretsManager } from "../classes/SecretsManager";

const getJWTSecret = () => SecretsManager.getInstance().getJWTSecret();

const generateToken = (id: string) => {
	const jwt = sign({ id }, getJWTSecret(), {
		expiresIn: "2h",
	});
	return jwt;
};

const verifyToken = (jwt: string) => {
	const isOk = verify(jwt, getJWTSecret());
	return isOk;
};

export { generateToken, verifyToken };
