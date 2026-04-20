import { nanoid } from "nanoid";
import { IPushTokenCreate } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";

export class PushTokenService {
	registrarToken = async (userId: string, data: IPushTokenCreate) => {
		const { platform, token } = data;

		await prismaClient.pushToken.upsert({
			where: {
				userId_platform_token: { userId, platform, token },
			},
			update: { active: true },
			create: {
				uuid: nanoid(10),
				userId,
				platform,
				token,
				active: true,
			},
		});
	};

	desregistrarToken = async (userId: string, platform: string, token: string) => {
		await prismaClient.pushToken.updateMany({
			where: { userId, platform, token },
			data: { active: false },
		});
	};

	getTokensDeUsuarios = async (userIds: string[]) => {
		return prismaClient.pushToken.findMany({
			where: {
				userId: { in: userIds },
				active: true,
			},
			select: {
				platform: true,
				token: true,
				userId: true,
			},
		});
	};
}
