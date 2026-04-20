import { z } from "zod";
import { VALID_PUSH_PLATFORMS } from "../types";

export const PushTokenSchema = z.object({
	platform: z.enum(VALID_PUSH_PLATFORMS),
	token: z.string().min(10).max(4096),
});

export const PostPushTokenSchema = z.object({
	body: PushTokenSchema,
});

export const DeletePushTokenSchema = z.object({
	body: PushTokenSchema,
});
