/**
 * Currency formatting and parsing utilities
 * Handles locale-aware display and safe input parsing
 * Supports Arabic-Indic digits, Arabic separators, and various currency formats
 */

/**
 * Arabic-Indic digit mapping (٠-٩)
 */
const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

/**
 * Eastern Arabic-Indic digit mapping (۰-۹)
 */
const EASTERN_ARABIC_DIGITS: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

/**
 * Normalize Arabic-Indic and Eastern Arabic-Indic digits to Latin digits (0-9)
 */
export const normalizeDigits = (input: string): string => {
  if (!input) return "";

  let result = input;

  // Replace Arabic-Indic digits (٠-٩)
  for (const [arabic, latin] of Object.entries(ARABIC_INDIC_DIGITS)) {
    result = result.replace(new RegExp(arabic, "g"), latin);
  }

  // Replace Eastern Arabic-Indic digits (۰-۹)
  for (const [arabic, latin] of Object.entries(EASTERN_ARABIC_DIGITS)) {
    result = result.replace(new RegExp(arabic, "g"), latin);
  }

  return result;
};

/**
 * Normalize separators:
 * - Remove thousands separators: ٬ (Arabic), comma, spaces
 * - Convert Arabic decimal separator ٫ to dot
 */
export const normalizeSeparators = (input: string): string => {
  if (!input) return "";

  return input
    .replace(/٬/g, "") // Arabic thousands separator
    .replace(/,/g, "") // Comma thousands separator
    .replace(/\s/g, "") // Spaces
    .replace(/٫/g, "."); // Arabic decimal separator → dot
};

/**
 * Parse a currency input string to a numeric value
 * Rules:
 * - Normalize Arabic digits and separators first
 * - Strip commas, spaces, currency symbols, and currency codes
 * - Allow up to 2 decimal places
 * - Prevent negative values (return absolute value)
 * - Return 0 for invalid inputs
 */
export const parseCurrencyInput = (input: string): number => {
  if (!input || input.trim() === "") {
    return 0;
  }

  // Step 1: Normalize Arabic digits and separators
  let cleaned = normalizeDigits(input);
  cleaned = normalizeSeparators(cleaned);

  // Step 2: Remove currency codes (USD, SAR, EUR, etc.) and common symbols
  cleaned = cleaned
    .replace(/[$€£¥]/g, "")
    .replace(/[A-Za-z]{3}/g, "") // 3-letter currency codes
    .trim();

  // Step 3: Parse as float
  const parsed = parseFloat(cleaned);

  // Step 4: Check if valid number
  if (isNaN(parsed)) {
    return 0;
  }

  // Step 5: Prevent negatives and round to 2 decimal places
  const absolute = Math.abs(parsed);
  return Math.round(absolute * 100) / 100;
};

/**
 * Format a numeric value for display with locale and currency
 */
export const formatCurrencyDisplay = (
  amount: number,
  locale: string = "en",
  currencyCode: string = "USD",
): string => {
  const validAmount = Math.abs(amount);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validAmount);
  } catch (error) {
    // Fallback if Intl is not available or currency code is invalid
    return `${validAmount.toFixed(2)}`;
  }
};

/**
 * Format a numeric value for display without currency symbol
 * Used for showing totals in a simplified format
 */
export const formatNumberDisplay = (
  amount: number,
  locale: string = "en",
): string => {
  const validAmount = Math.abs(amount);

  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validAmount);
  } catch (error) {
    return validAmount.toFixed(2);
  }
};

/**
 * Validate if a parsed amount is valid for saving
 * Must be greater than 0
 */
export const isValidAmount = (amount: number): boolean => {
  return amount > 0;
};

/**
 * Sanitize user input in real-time
 * - Works while typing (allows Arabic digits/separators temporarily)
 * - Normalizes digits + separators first
 * - Keeps only digits and a single decimal dot
 * - If multiple dots exist, keeps first dot and removes rest
 * - Limits decimals to max 2 digits
 */
export const sanitizeCurrencyInput = (input: string): string => {
  if (!input) return "";

  // Step 1: Normalize Arabic digits and separators
  let sanitized = normalizeDigits(input);
  sanitized = normalizeSeparators(sanitized);

  // Step 2: Keep only digits and decimal points
  sanitized = sanitized.replace(/[^\d.]/g, "");

  // Step 3: Handle multiple decimal points
  // Keep the first dot as the decimal separator, rest become part of number
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    // Join all parts after the first one (removing extra dots)
    const integerPart = parts[0];
    const decimalPart = parts.slice(1).join("");
    sanitized = integerPart + "." + decimalPart;
  }

  // Step 4: Re-split and limit to 2 decimal places
  const finalParts = sanitized.split(".");
  if (finalParts.length === 2 && finalParts[1].length > 2) {
    sanitized = finalParts[0] + "." + finalParts[1].slice(0, 2);
  }

  return sanitized;
};
