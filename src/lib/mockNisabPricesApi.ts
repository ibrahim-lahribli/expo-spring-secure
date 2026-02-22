export interface MockNisabPricesResponse {
  goldPricePerGram: number;
  silverPricePerGram: number;
  fetchedAt: string;
  sourceName: string;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export async function fetchMockNisabPrices(): Promise<MockNisabPricesResponse> {
  // Simulate a network call for market pricing.
  await new Promise((resolve) => setTimeout(resolve, 700));

  const goldPricePerGram = Number(randomInRange(72, 79).toFixed(2));
  const silverPricePerGram = Number(randomInRange(0.85, 1.25).toFixed(2));

  return {
    goldPricePerGram,
    silverPricePerGram,
    fetchedAt: new Date().toISOString(),
    sourceName: "Mock Metals Feed",
  };
}

