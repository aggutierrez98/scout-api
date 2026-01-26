import { createClient } from "redis";
import { SecretsManager } from "./SecretsManager";
type CacheValue = any | null;

const MAX_REDIS_CONNECTION_RETRIES = 20
const MAX_REDIS_CONNECTION_TIMEOUT_MS = 10000
const REDIS_RETRY_TIME_MS = 500

export class CacheManager {
	private static instance: CacheManager;
	private readonly client;

	private constructor() {
		this.client = createClient({
			url: SecretsManager.getInstance().getRedisURI(),
			socket: {
				reconnectStrategy: function (retries) {
					if (retries > MAX_REDIS_CONNECTION_RETRIES) {
						console.error("Demasiados intentos de reconexión. La conexión del Cache Manager fue terminada");
						return new Error("Too many retries.");
					} else {
						return retries * REDIS_RETRY_TIME_MS;
					}
				},
				connectTimeout: MAX_REDIS_CONNECTION_TIMEOUT_MS
			}
		});
		this.client.on("connect", () => {
			console.info("✅ Cache Manager inicializado correctamente");
		});
		this.client.on("error", (error) => {
			console.error(`❌ Error del cliente de Cache Manager. ERROR: ${error}`);
		});
	}

	async initialize(): Promise<void> {
		await this.connectIfNecessary();
	}

	static getInstance(): CacheManager {
		if (!CacheManager.instance) {
			CacheManager.instance = new CacheManager();
		}
		return CacheManager.instance;
	}

	async connectIfNecessary(): Promise<void> {
		if (this.client.isOpen) return
		if (this.client.isReady) return
		await this.client.connect();
	}

	async isHealthy(): Promise<boolean> {
		try {
			await this.connectIfNecessary();
			await this.client.ping();
			return true;
		} catch (error) {
			return false;
		}
	}

	async set(
		key: string,
		value: CacheValue,
		options: { expirationInMs?: number } = {},
	): Promise<void> {
		await this.connectIfNecessary();

		const stringifiedValue =
			typeof value === "string" ? value : this.stringifyValueForStoring(value);

		await this.client.set(key, stringifiedValue, {
			PX: options.expirationInMs,
		});
	}

	async get(key: string): Promise<CacheValue | null> {
		await this.connectIfNecessary();
		const value = await this.client.get(key);

		if (!value) return null;

		return this.transformValueFromStorageFormat(value);
	}

	async clearData(key: string) {
		await this.connectIfNecessary();
		this.client.del(key);
	}

	private stringifyValueForStoring(value: CacheValue): string {
		return JSON.stringify(value);
	}

	private transformValueFromStorageFormat(value: string): CacheValue | null {
		try {
			return JSON.parse(value);
		} catch (error) {
			return null;
		}
	}
}
