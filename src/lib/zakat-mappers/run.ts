import { calculateTotalZakat } from "../zakat-engine/src/calculateTotalZakat";
import {
  ZakatCalculationResult,
  ZakatInput,
} from "../zakat-engine/src/core/types";

export function runZakatCalculation(input: ZakatInput): ZakatCalculationResult {
  // Here we could add default parameters for prices if needed,
  // but calculateTotalZakat handles defaults if undefined.
  // For Quick Calc, we assume standard silver/gold prices or let engine use defaults.
  // We can also pass explicit prices if the UI collects them later.

  return calculateTotalZakat(input);
}
