import type {
  AgricultureProductsInput,
  CropsInput,
  IndustryInput,
  IrrigationMethod,
  LivestockInput,
  MineralsInput,
  NisabMethod,
  SalaryInput,
  TradeInput,
  ZakatInput,
} from "../zakat-engine/src/core/types";

// ─── Form state types ────────────────────────────────────────────────────────

export interface DetailedSalaryForm {
  monthlyIncome: string;
}

export interface DetailedTradeForm {
  inventoryValue: string;
  cash: string;
  receivables: string;
  liabilities: string;
  expensesDue: string;
}

export interface DetailedIndustryForm {
  inventoryValue: string;
  cash: string;
  receivables: string;
  liabilities: string;
  productionCosts: string;
  salariesDue: string;
  rentDue: string;
  taxesDue: string;
}

export interface DetailedCropsForm {
  harvestKg: string;
  irrigationMethod: IrrigationMethod;
  soldCommercially: boolean;
  marketValuePerKg: string;
}

export interface DetailedLivestockForm {
  sheep: string;
  goats: string;
  cattle: string;
  camels: string;
  marketPricePerSheep: string;
  marketPricePerGoat: string;
  marketPricePerCattle: string;
  marketPricePerCamel: string;
  marketPricePerCalf: string;
}

export interface DetailedAgricultureProductsForm {
  revenue: string;
  costs: string;
}

export interface DetailedMineralsForm {
  extractedValue: string;
  extractionCosts: string;
}

export interface DetailedGlobalSettingsForm {
  nisabMethod: NisabMethod;
  silverPricePerGram: string;
  goldPricePerGram: string;
  nisabOverride: string;
}

export interface DetailedFormState {
  global: DetailedGlobalSettingsForm;
  salary: DetailedSalaryForm;
  trade: DetailedTradeForm;
  industry: DetailedIndustryForm;
  crops: DetailedCropsForm;
  livestock: DetailedLivestockForm;
  agricultureProducts: DetailedAgricultureProductsForm;
  minerals: DetailedMineralsForm;
}

export interface CategoryToggles {
  salary: boolean;
  trade: boolean;
  industry: boolean;
  crops: boolean;
  livestock: boolean;
  agricultureProducts: boolean;
  minerals: boolean;
}

export interface MapDetailedResult {
  zakatInput: ZakatInput | null;
  validationError: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely converts a string to a non-negative number. Returns 0 for empty/NaN. */
function safeNum(value: string): number {
  const n = Number(value);
  if (isNaN(n) || !isFinite(n)) return 0;
  return Math.max(0, n);
}

/** Returns undefined for optional positive number fields when empty/zero */
function safeOptionalPositiveNum(value: string): number | undefined {
  const n = Number(value);
  if (!value || value.trim() === "" || isNaN(n) || n <= 0) return undefined;
  return n;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

/**
 * Maps the detailed form state and enabled category toggles into a valid ZakatInput.
 * Returns { zakatInput, validationError }.
 * If validationError is non-null, zakatInput is null and the calculation should not proceed.
 */
export function mapDetailedToEngine(
  form: DetailedFormState,
  toggles: CategoryToggles,
): MapDetailedResult {
  // Validate: at least one category must be enabled
  const anyEnabled = Object.values(toggles).some(Boolean);
  if (!anyEnabled) {
    return {
      zakatInput: null,
      validationError:
        "Please enable at least one category to calculate Zakat.",
    };
  }

  // Validate livestock conditional: marketPricePerCalf required when cattle > 0
  if (toggles.livestock) {
    const cattleCount = safeNum(form.livestock.cattle);
    if (cattleCount > 0 && !form.livestock.marketPricePerCalf.trim()) {
      return {
        zakatInput: null,
        validationError:
          "Market Price Per Calf is required when you have cattle.",
      };
    }
  }

  // Build ZakatInput
  const input: ZakatInput = {};

  // Global settings
  input.nisabMethod = form.global.nisabMethod;
  const silverPrice = safeOptionalPositiveNum(form.global.silverPricePerGram);
  const goldPrice = safeOptionalPositiveNum(form.global.goldPricePerGram);
  const nisabOverride = safeOptionalPositiveNum(form.global.nisabOverride);
  if (silverPrice !== undefined) input.silverPricePerGram = silverPrice;
  if (goldPrice !== undefined) input.goldPricePerGram = goldPrice;
  if (nisabOverride !== undefined) input.nisabOverride = nisabOverride;

  // Salary
  if (toggles.salary) {
    const salary: SalaryInput = {
      monthlyIncome: safeNum(form.salary.monthlyIncome),
    };
    input.salary = salary;
  }

  // Trade
  if (toggles.trade) {
    const trade: TradeInput = {
      inventoryValue: safeNum(form.trade.inventoryValue),
      cash: safeNum(form.trade.cash),
      receivables: safeNum(form.trade.receivables),
      liabilities: safeNum(form.trade.liabilities),
      expensesDue: safeNum(form.trade.expensesDue),
    };
    input.trade = trade;
  }

  // Industry
  if (toggles.industry) {
    const industry: IndustryInput = {
      inventoryValue: safeNum(form.industry.inventoryValue),
      cash: safeNum(form.industry.cash),
      receivables: safeNum(form.industry.receivables),
      liabilities: safeNum(form.industry.liabilities),
      productionCosts: safeNum(form.industry.productionCosts),
      salariesDue: safeNum(form.industry.salariesDue),
      rentDue: safeNum(form.industry.rentDue),
      taxesDue: safeNum(form.industry.taxesDue),
    };
    input.industry = industry;
  }

  // Crops
  if (toggles.crops) {
    const crops: CropsInput = {
      harvestKg: safeNum(form.crops.harvestKg),
      irrigationMethod: form.crops.irrigationMethod,
    };
    if (form.crops.soldCommercially) {
      crops.soldCommercially = true;
      const mvpkg = safeOptionalPositiveNum(form.crops.marketValuePerKg);
      if (mvpkg !== undefined) crops.marketValuePerKg = mvpkg;
    }
    input.crops = crops;
  }

  // Livestock
  if (toggles.livestock) {
    const livestock: LivestockInput = {};
    const sheep = safeNum(form.livestock.sheep);
    const goats = safeNum(form.livestock.goats);
    const cattle = safeNum(form.livestock.cattle);
    const camels = safeNum(form.livestock.camels);

    if (sheep > 0) livestock.sheep = sheep;
    if (goats > 0) livestock.goats = goats;
    if (cattle > 0) {
      livestock.cattle = cattle;
      livestock.marketPricePerCalf = safeNum(form.livestock.marketPricePerCalf);
    }
    if (camels > 0) livestock.camels = camels;

    const pSheep = safeOptionalPositiveNum(form.livestock.marketPricePerSheep);
    const pGoat = safeOptionalPositiveNum(form.livestock.marketPricePerGoat);
    const pCattle = safeOptionalPositiveNum(
      form.livestock.marketPricePerCattle,
    );
    const pCamel = safeOptionalPositiveNum(form.livestock.marketPricePerCamel);
    if (pSheep !== undefined) livestock.marketPricePerSheep = pSheep;
    if (pGoat !== undefined) livestock.marketPricePerGoat = pGoat;
    if (pCattle !== undefined) livestock.marketPricePerCattle = pCattle;
    if (pCamel !== undefined) livestock.marketPricePerCamel = pCamel;

    input.livestock = livestock;
  }

  // Agriculture Products
  if (toggles.agricultureProducts) {
    const agricultureProducts: AgricultureProductsInput = {
      revenue: safeNum(form.agricultureProducts.revenue),
      costs: safeNum(form.agricultureProducts.costs),
    };
    input.agricultureProducts = agricultureProducts;
  }

  // Minerals
  if (toggles.minerals) {
    const minerals: MineralsInput = {
      extractedValue: safeNum(form.minerals.extractedValue),
      extractionCosts: safeNum(form.minerals.extractionCosts),
    };
    input.minerals = minerals;
  }

  return { zakatInput: input, validationError: null };
}
