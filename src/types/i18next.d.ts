import "i18next";
import enAuth from "../i18n/locales/en/auth.json";
import enCalculate from "../i18n/locales/en/calculate.json";
import enCommon from "../i18n/locales/en/common.json";
import enErrors from "../i18n/locales/en/errors.json";
import enHome from "../i18n/locales/en/home.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof enCommon;
      auth: typeof enAuth;
      calculate: typeof enCalculate;
      home: typeof enHome;
      errors: typeof enErrors;
    };
    // Enable type checking for namespaces
    ns: "common" | "auth" | "calculate" | "home" | "errors";
  }
}
