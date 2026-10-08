import crypto from "crypto";
import type { Response } from "express";
import { LRUCache } from "lru-cache";
import { env } from "./env";

type CacheDriverName = "memory" | "redis";
type CacheStatus = "HIT" | "MISS" | "BYPASS";

type CacheDriver = {
  name: CacheDriverName;
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  entryCount(): Promise<number>;
};

type CacheStats = {
  hits: number;
  misses: number;
  evictions: number;
};

const stats: CacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0
};

const memoryCache = new LRUCache<string, string>({
  max: env.CACHE_MAX_ENTRIES,
  ttl: env.CACHE_DEFAULT_TTL_SECONDS * 1000,
  dispose: (_value, _key, reason) => {
    if (reason === "evict") stats.evictions += 1;
  }
});

const memoryDriver: CacheDriver = {
  name: "memory",
  async get(key) {
    return memoryCache.get(key);
  },
  async set(key, value, ttlSeconds) {
    memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });
  },
  async del(key) {
    memoryCache.delete(key);
  },
  async clear() {
    memoryCache.clear();
  },
  async entryCount() {
    return memoryCache.size;
  }
};

let activeDriver: CacheDriver | undefined;
let redisWarningLogged = false;
const pendingLoads = new Map<string, Promise<unknown>>();

function warnCache(message: string, error?: unknown) {
  const detail = error instanceof Error ? `: ${error.message}` : "";
  console.warn(`[cache] ${message}${detail}`);
}

function warnRedisOnce(message: string, error?: unknown) {
  if (redisWarningLogged) return;
  redisWarningLogged = true;
  warnCache(message, error);
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function serialize(value: unknown): string | undefined {
  const serialized = JSON.stringify(value);
  return serialized === undefined ? undefined : serialized;
}

function ttlWithJitter(ttlSeconds: number) {
  const jitter = ttlSeconds * 0.1 * Math.random();
  return Math.max(1, Math.round(ttlSeconds - jitter));
}

async function createRedisDriver(): Promise<CacheDriver | undefined> {
  if (!env.CACHE_URL) {
    warnRedisOnce("CACHE_DRIVER=redis requires CACHE_URL; using memory cache");
    return undefined;
  }

  try {
    const { Redis } = await import("ioredis");
    const client = new Redis(env.CACHE_URL, {
      connectTimeout: 200,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    client.on("error", (error: Error) => {
      warnRedisOnce("Redis cache error; requests will continue", error);
    });

    await client.connect();

    return {
      name: "redis",
      async get(key) {
        return (await client.get(key)) ?? undefined;
      },
      async set(key, value, ttlSeconds) {
        await client.set(key, value, "EX", ttlSeconds);
      },
      async del(key) {
        await client.del(key);
      },
      async clear() {
        const keys = await client.keys("cache:*");
        if (keys.length) await client.del(...keys);
      },
      async entryCount() {
        const keys = await client.keys("cache:*");
        return keys.length;
      }
    };
  } catch (error) {
    warnRedisOnce("Redis cache connection failed; using memory cache", error);
    return undefined;
  }
}

async function getDriver(): Promise<CacheDriver> {
  if (activeDriver) return activeDriver;
  if (env.CACHE_DRIVER === "redis") {
    activeDriver = (await createRedisDriver()) ?? memoryDriver;
    return activeDriver;
  }
  activeDriver = memoryDriver;
  return activeDriver;
}

function scopedKey(key: string) {
  return `cache:${key}`;
}

export function hashCachePart(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
}

export function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
      return accumulator;
    }, {});
}

export async function getCache<T>(key: string): Promise<T | undefined> {
  if (!env.CACHE_ENABLED) return undefined;

  try {
    const cached = await (await getDriver()).get(scopedKey(key));
    if (cached === undefined) {
      stats.misses += 1;
      return undefined;
    }

    stats.hits += 1;
    return jsonClone(JSON.parse(cached) as T);
  } catch (error) {
    warnCache("read failed", error);
    return undefined;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS): Promise<void> {
  if (!env.CACHE_ENABLED) return;

  try {
    const serialized = serialize(value);
    if (serialized === undefined) return;
    await (await getDriver()).set(scopedKey(key), serialized, ttlWithJitter(ttlSeconds));
  } catch (error) {
    warnCache("write failed", error);
  }
}

export async function delCache(key: string): Promise<void> {
  if (!env.CACHE_ENABLED) return;

  try {
    await (await getDriver()).del(scopedKey(key));
  } catch (error) {
    warnCache("delete failed", error);
  }
}

export async function remember<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const result = await rememberWithStatus(key, ttlSeconds, loader);
  return result.value;
}

export async function rememberWithStatus<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<{ value: T; status: CacheStatus }> {
  if (!env.CACHE_ENABLED) {
    return { value: await loader(), status: "BYPASS" };
  }

  const cached = await getCache<T>(key);
  if (cached !== undefined) {
    return { value: cached, status: "HIT" };
  }

  const existing = pendingLoads.get(key) as Promise<T> | undefined;
  if (existing) {
    return { value: jsonClone(await existing), status: "MISS" };
  }

  const pending = loader();
  pendingLoads.set(key, pending);

  try {
    const value = await pending;
    await setCache(key, value, ttlSeconds);
    return { value: jsonClone(value), status: "MISS" };
  } finally {
    pendingLoads.delete(key);
  }
}

export async function flushCache(): Promise<void> {
  pendingLoads.clear();
  await (await getDriver()).clear();
}

export async function getCacheStats() {
  const driver = await getDriver();
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    hitRate: total ? stats.hits / total : 0,
    driver: driver.name,
    entryCount: await driver.entryCount(),
    enabled: env.CACHE_ENABLED
  };
}

export function setCacheStatusHeader(res: Response, status: CacheStatus) {
  if (env.NODE_ENV !== "production" && status !== "BYPASS") {
    res.setHeader("X-Cache", status);
  }
}
