import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function setBaseEnv(overrides: Record<string, string> = {}) {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/cache-test");
  vi.stubEnv("JWT_SECRET", "test-secret-that-is-long-enough");
  vi.stubEnv("CACHE_ENABLED", "true");
  vi.stubEnv("CACHE_DRIVER", "memory");
  vi.stubEnv("CACHE_URL", "");
  vi.stubEnv("CACHE_MAX_ENTRIES", "500");
  vi.stubEnv("CACHE_DEFAULT_TTL_SECONDS", "60");

  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value);
  }
}

async function importCache(overrides: Record<string, string> = {}) {
  vi.resetModules();
  setBaseEnv(overrides);
  return import("./cache");
}

describe("cache", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("expires entries after their TTL", async () => {
    const { getCache, setCache } = await importCache();

    await setCache("ttl-test", { ok: true }, 1);

    await expect(getCache("ttl-test")).resolves.toEqual({ ok: true });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await expect(getCache("ttl-test")).resolves.toBeUndefined();
  });

  it("evicts least-recently-used entries when max entries is reached", async () => {
    const { getCache, setCache } = await importCache({ CACHE_MAX_ENTRIES: "1" });

    await setCache("first", { value: 1 });
    await setCache("second", { value: 2 });

    await expect(getCache("first")).resolves.toBeUndefined();
    await expect(getCache("second")).resolves.toEqual({ value: 2 });
  });

  it("shares one loader across concurrent misses", async () => {
    const { remember } = await importCache();
    let calls = 0;

    const requests = Array.from({ length: 10 }, () =>
      remember("single-flight", 60, async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { value: "loaded" };
      })
    );

    await expect(Promise.all(requests)).resolves.toEqual(Array.from({ length: 10 }, () => ({ value: "loaded" })));
    expect(calls).toBe(1);
  });

  it("changes versioned keys when a namespace is invalidated", async () => {
    vi.resetModules();
    setBaseEnv();
    const { cacheKey, invalidateListings } = await import("../utils/cacheKeys");

    const before = cacheKey("listings", "list:abc");
    invalidateListings();
    const after = cacheKey("listings", "list:abc");

    expect(after).not.toBe(before);
  });

  it("bypasses cache when disabled", async () => {
    const { remember } = await importCache({ CACHE_ENABLED: "false" });
    let calls = 0;

    const loader = async () => {
      calls += 1;
      return { calls };
    };

    await expect(remember("disabled", 60, loader)).resolves.toEqual({ calls: 1 });
    await expect(remember("disabled", 60, loader)).resolves.toEqual({ calls: 2 });
    expect(calls).toBe(2);
  });

  it("falls back to memory when Redis cannot connect", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { getCacheStats } = await importCache({
      CACHE_DRIVER: "redis",
      CACHE_URL: "redis://127.0.0.1:1"
    });

    await expect(getCacheStats()).resolves.toMatchObject({ driver: "memory" });
  });
});
