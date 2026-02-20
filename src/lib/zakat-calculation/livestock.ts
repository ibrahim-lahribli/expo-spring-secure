export type LivestockType = "camels" | "cattle" | "sheep_goats";

export type CamelClass = "bint_makhad" | "bint_labun" | "hiqqah" | "jadhaah";
export type CattleClass = "tabi" | "musinnah";
export type Camel121Choice = "2_hiqqah" | "3_bint_labun";

export type SheepDueItem = {
  kind: "sheep";
  count: number;
};

export type CamelDueItem = {
  kind: "camel_class";
  class: CamelClass;
  count: number;
};

export type CattleDueItem = {
  kind: "cattle_class";
  class: CattleClass;
  count: number;
};

export type DueItem = SheepDueItem | CamelDueItem | CattleDueItem;

export type LivestockZakatResult = {
  dueItems: DueItem[];
  dueText: string;
  isDue: boolean;
  camel121ChoiceOptions?: {
    first: DueItem[];
    second: DueItem[];
  };
};

export type LivestockCalcOptions = {
  camel121Choice?: Camel121Choice;
};

export function calcLivestockZakat(
  type: LivestockType,
  owned: number,
  options?: LivestockCalcOptions,
): LivestockZakatResult {
  const safeOwned = sanitizeOwned(owned);
  if (type === "camels") {
    return calculateCamelZakat(safeOwned, options);
  }
  if (type === "cattle") {
    return calculateCattleZakat(safeOwned);
  }
  return calculateSheepGoatZakat(safeOwned);
}

export type DueItemPriceKey =
  | "sheep"
  | "camel_bint_makhad"
  | "camel_bint_labun"
  | "camel_hiqqah"
  | "camel_jadhaah"
  | "cattle_tabi"
  | "cattle_musinnah";

export type DueItemPrices = Partial<Record<DueItemPriceKey, number>>;

export function getDueItemPriceKey(item: DueItem): DueItemPriceKey {
  if (item.kind === "sheep") {
    return "sheep";
  }
  if (item.kind === "camel_class") {
    return `camel_${item.class}`;
  }
  return `cattle_${item.class}`;
}

export function getDueItemLabel(item: DueItem): string {
  if (item.kind === "sheep") {
    return "sheep";
  }
  if (item.kind === "camel_class") {
    return camelClassLabel(item.class);
  }
  return cattleClassLabel(item.class);
}

export function calcCashEquivalent(
  dueItems: DueItem[],
  pricesMap: DueItemPrices,
): number | undefined {
  if (dueItems.length === 0) {
    return 0;
  }
  let total = 0;
  for (const item of dueItems) {
    const key = getDueItemPriceKey(item);
    const price = pricesMap[key];
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return undefined;
    }
    total += item.count * price;
  }
  return total;
}

function sanitizeOwned(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function calculateCamelZakat(
  owned: number,
  options?: LivestockCalcOptions,
): LivestockZakatResult {
  if (owned <= 4) {
    return noDueResult();
  }
  if (owned <= 9) {
    return buildResult([{ kind: "sheep", count: 1 }]);
  }
  if (owned <= 14) {
    return buildResult([{ kind: "sheep", count: 2 }]);
  }
  if (owned <= 19) {
    return buildResult([{ kind: "sheep", count: 3 }]);
  }
  if (owned <= 24) {
    return buildResult([{ kind: "sheep", count: 4 }]);
  }
  if (owned <= 35) {
    return buildResult([{ kind: "camel_class", class: "bint_makhad", count: 1 }]);
  }
  if (owned <= 45) {
    return buildResult([{ kind: "camel_class", class: "bint_labun", count: 1 }]);
  }
  if (owned <= 60) {
    return buildResult([{ kind: "camel_class", class: "hiqqah", count: 1 }]);
  }
  if (owned <= 75) {
    return buildResult([{ kind: "camel_class", class: "jadhaah", count: 1 }]);
  }
  if (owned <= 90) {
    return buildResult([{ kind: "camel_class", class: "bint_labun", count: 2 }]);
  }
  if (owned <= 120) {
    return buildResult([{ kind: "camel_class", class: "hiqqah", count: 2 }]);
  }
  if (owned <= 129) {
    const first: DueItem[] = [{ kind: "camel_class", class: "hiqqah", count: 2 }];
    const second: DueItem[] = [{ kind: "camel_class", class: "bint_labun", count: 3 }];
    const selected = options?.camel121Choice === "3_bint_labun" ? second : first;
    const result = buildResult(selected);
    return {
      ...result,
      camel121ChoiceOptions: { first, second },
    };
  }

  const combo = findCamelCombination(owned);
  const dueItems: DueItem[] = [];
  if (combo.bintLabunCount > 0) {
    dueItems.push({
      kind: "camel_class",
      class: "bint_labun",
      count: combo.bintLabunCount,
    });
  }
  if (combo.hiqqahCount > 0) {
    dueItems.push({
      kind: "camel_class",
      class: "hiqqah",
      count: combo.hiqqahCount,
    });
  }
  return buildResult(dueItems);
}

function calculateCattleZakat(owned: number): LivestockZakatResult {
  if (owned <= 29) {
    return noDueResult();
  }
  if (owned <= 39) {
    return buildResult([{ kind: "cattle_class", class: "tabi", count: 1 }]);
  }
  if (owned <= 59) {
    return buildResult([{ kind: "cattle_class", class: "musinnah", count: 1 }]);
  }

  const combo = findCattleCombination(owned);
  const dueItems: DueItem[] = [];
  if (combo.tabiCount > 0) {
    dueItems.push({
      kind: "cattle_class",
      class: "tabi",
      count: combo.tabiCount,
    });
  }
  if (combo.musinnahCount > 0) {
    dueItems.push({
      kind: "cattle_class",
      class: "musinnah",
      count: combo.musinnahCount,
    });
  }
  return buildResult(dueItems);
}

function calculateSheepGoatZakat(owned: number): LivestockZakatResult {
  if (owned <= 39) {
    return noDueResult();
  }
  if (owned <= 120) {
    return buildResult([{ kind: "sheep", count: 1 }]);
  }
  if (owned <= 200) {
    return buildResult([{ kind: "sheep", count: 2 }]);
  }
  if (owned <= 399) {
    return buildResult([{ kind: "sheep", count: 3 }]);
  }
  return buildResult([{ kind: "sheep", count: Math.floor(owned / 100) }]);
}

function noDueResult(): LivestockZakatResult {
  return {
    dueItems: [],
    dueText: "No zakat due",
    isDue: false,
  };
}

function buildResult(dueItems: DueItem[]): LivestockZakatResult {
  if (dueItems.length === 0) {
    return noDueResult();
  }
  return {
    dueItems,
    dueText: formatDueItems(dueItems),
    isDue: true,
  };
}

function formatDueItems(items: DueItem[]): string {
  return items.map((item) => `${item.count} ${getDueItemLabel(item)}`).join(" + ");
}

function camelClassLabel(value: CamelClass): string {
  if (value === "bint_makhad") {
    return "bint makhad";
  }
  if (value === "bint_labun") {
    return "bint labun";
  }
  if (value === "hiqqah") {
    return "hiqqah";
  }
  return "jadhaah";
}

function cattleClassLabel(value: CattleClass): string {
  if (value === "tabi") {
    return "tabi";
  }
  return "musinnah";
}

type CamelCombo = {
  bintLabunCount: number;
  hiqqahCount: number;
  covered: number;
  remainder: number;
};

function findCamelCombination(owned: number): CamelCombo {
  let best: CamelCombo | null = null;
  const maxHiqqah = Math.floor(owned / 50);

  for (let hiqqahCount = 0; hiqqahCount <= maxHiqqah; hiqqahCount += 1) {
    const remainingAfterHiqqah = owned - hiqqahCount * 50;
    const maxBintLabun = Math.floor(remainingAfterHiqqah / 40);
    for (let bintLabunCount = 0; bintLabunCount <= maxBintLabun; bintLabunCount += 1) {
      const covered = bintLabunCount * 40 + hiqqahCount * 50;
      if (covered < 130) {
        continue;
      }
      const remainder = owned - covered;
      if (remainder < 0 || remainder >= 40) {
        continue;
      }
      const candidate: CamelCombo = {
        bintLabunCount,
        hiqqahCount,
        covered,
        remainder,
      };
      if (isBetterCamelCombo(candidate, best)) {
        best = candidate;
      }
    }
  }

  if (best) {
    return best;
  }

  return {
    bintLabunCount: 2,
    hiqqahCount: 1,
    covered: 130,
    remainder: Math.max(0, owned - 130),
  };
}

function isBetterCamelCombo(candidate: CamelCombo, current: CamelCombo | null): boolean {
  if (!current) {
    return true;
  }
  if (candidate.remainder !== current.remainder) {
    return candidate.remainder < current.remainder;
  }
  const candidateAnimals = candidate.bintLabunCount + candidate.hiqqahCount;
  const currentAnimals = current.bintLabunCount + current.hiqqahCount;
  if (candidateAnimals !== currentAnimals) {
    return candidateAnimals < currentAnimals;
  }
  return candidate.hiqqahCount > current.hiqqahCount;
}

type CattleCombo = {
  tabiCount: number;
  musinnahCount: number;
  covered: number;
  remainder: number;
};

function findCattleCombination(owned: number): CattleCombo {
  let best: CattleCombo | null = null;
  const maxMusinnah = Math.floor(owned / 40);

  for (let musinnahCount = 0; musinnahCount <= maxMusinnah; musinnahCount += 1) {
    const remainingAfterMusinnah = owned - musinnahCount * 40;
    const maxTabi = Math.floor(remainingAfterMusinnah / 30);
    for (let tabiCount = 0; tabiCount <= maxTabi; tabiCount += 1) {
      const covered = tabiCount * 30 + musinnahCount * 40;
      if (covered < 60) {
        continue;
      }
      const remainder = owned - covered;
      if (remainder < 0 || remainder >= 30) {
        continue;
      }
      const candidate: CattleCombo = {
        tabiCount,
        musinnahCount,
        covered,
        remainder,
      };
      if (isBetterCattleCombo(candidate, best)) {
        best = candidate;
      }
    }
  }

  if (best) {
    return best;
  }

  return {
    tabiCount: 2,
    musinnahCount: 0,
    covered: 60,
    remainder: Math.max(0, owned - 60),
  };
}

function isBetterCattleCombo(
  candidate: CattleCombo,
  current: CattleCombo | null,
): boolean {
  if (!current) {
    return true;
  }
  if (candidate.remainder !== current.remainder) {
    return candidate.remainder < current.remainder;
  }
  const candidateAnimals = candidate.tabiCount + candidate.musinnahCount;
  const currentAnimals = current.tabiCount + current.musinnahCount;
  if (candidateAnimals !== currentAnimals) {
    return candidateAnimals < currentAnimals;
  }
  return candidate.musinnahCount > current.musinnahCount;
}
