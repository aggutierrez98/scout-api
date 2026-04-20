export const VALID_PUSH_PLATFORMS = ["EXPO", "WEB"] as const;
export type PushPlatform = (typeof VALID_PUSH_PLATFORMS)[number];

export interface IPushTokenCreate {
	platform: PushPlatform;
	token: string;
}

export interface IPushTokenData {
	id: string;
	platform: string;
	token: string;
	active: boolean;
}
