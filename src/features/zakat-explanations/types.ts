import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface LocalizedText {
  key: string;
  defaultText: string;
}

export interface RateInfo {
  label: LocalizedText;
  value: string;
  condition?: LocalizedText;
}

export interface CalculationStep {
  title: LocalizedText;
  description: LocalizedText;
}

export interface ZakatExample {
  title: LocalizedText;
  inputs: LocalizedText[];
  result: LocalizedText;
}

export interface FAQItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface ZakatCategory {
  slug: string;
  icon: IconName;
  title: LocalizedText;
  shortSummary: LocalizedText;
  rates: RateInfo[];
  overview: {
    whatItCovers: LocalizedText;
    whenDue: LocalizedText;
    calculationMethod: LocalizedText;
  };
  conditions: LocalizedText[];
  deductions: LocalizedText[];
  includedItems: LocalizedText[];
  calculationSteps: CalculationStep[];
  examples: ZakatExample[];
  fatwaExcerptArabic: string[];
  fatwaExplanation?: LocalizedText;
  notes: LocalizedText[];
  faq?: FAQItem[];
}
