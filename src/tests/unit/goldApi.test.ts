import { fetchGoldApiNisabPrices } from "../../lib/goldApi";

describe("fetchGoldApiNisabPrices", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("fetches gold and silver ounce prices and converts them to price per gram", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ price: 3103.4768, timestamp: 1700000000 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ price: 31.1034768, timestamp: 1700000500 }),
      });

    await expect(fetchGoldApiNisabPrices("MAD", "test-key")).resolves.toEqual({
      goldPricePerGram: 99.7791,
      silverPricePerGram: 1,
      fetchedAt: "2023-11-14T22:21:40.000Z",
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://www.goldapi.io/api/XAU/MAD",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-access-token": "test-key",
        }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://www.goldapi.io/api/XAG/MAD",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-access-token": "test-key",
        }),
      }),
    );
  });

  it("throws when the api key is missing", async () => {
    await expect(fetchGoldApiNisabPrices("MAD")).rejects.toThrow(
      "Missing GoldAPI key. Set EXPO_PUBLIC_GOLDAPI_KEY before fetching live prices.",
    );
  });

  it("throws the GoldAPI error payload when a request fails", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Forbidden" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ price: 31.1034768, timestamp: 1700000500 }),
      });

    await expect(fetchGoldApiNisabPrices("MAD", "test-key")).rejects.toThrow("Forbidden");
  });
});
