import {
  createRTLStyles,
  getFlexDirection,
  getMarginEnd,
  getMarginStart,
  getPaddingEnd,
  getPaddingStart,
  getTextAlign,
} from "../../utils/rtlUtils";

// Mock the isRTL function from i18n
jest.mock("../../i18n/i18n", () => ({
  isRTL: (language: string) => language === "ar",
}));

describe("RTL Utilities", () => {
  describe("getTextAlign", () => {
    it("should return 'right' for Arabic", () => {
      expect(getTextAlign("ar")).toBe("right");
    });

    it("should return 'left' for English", () => {
      expect(getTextAlign("en")).toBe("left");
    });

    it("should return 'left' for French", () => {
      expect(getTextAlign("fr")).toBe("left");
    });
  });

  describe("getFlexDirection", () => {
    it("should return 'row-reverse' for Arabic", () => {
      expect(getFlexDirection("ar")).toBe("row-reverse");
    });

    it("should return 'row' for English", () => {
      expect(getFlexDirection("en")).toBe("row");
    });

    it("should return 'row' for French", () => {
      expect(getFlexDirection("fr")).toBe("row");
    });
  });

  describe("getMarginStart", () => {
    it("should return 'marginRight' for Arabic", () => {
      expect(getMarginStart("ar")).toBe("marginRight");
    });

    it("should return 'marginLeft' for English", () => {
      expect(getMarginStart("en")).toBe("marginLeft");
    });
  });

  describe("getMarginEnd", () => {
    it("should return 'marginLeft' for Arabic", () => {
      expect(getMarginEnd("ar")).toBe("marginLeft");
    });

    it("should return 'marginRight' for English", () => {
      expect(getMarginEnd("en")).toBe("marginRight");
    });
  });

  describe("getPaddingStart", () => {
    it("should return 'paddingRight' for Arabic", () => {
      expect(getPaddingStart("ar")).toBe("paddingRight");
    });

    it("should return 'paddingLeft' for English", () => {
      expect(getPaddingStart("en")).toBe("paddingLeft");
    });
  });

  describe("getPaddingEnd", () => {
    it("should return 'paddingLeft' for Arabic", () => {
      expect(getPaddingEnd("ar")).toBe("paddingLeft");
    });

    it("should return 'paddingRight' for English", () => {
      expect(getPaddingEnd("en")).toBe("paddingRight");
    });
  });

  describe("createRTLStyles", () => {
    it("should return RTL styles for Arabic", () => {
      const styles = createRTLStyles("ar");

      expect(styles.textAlign).toBe("right");
      expect(styles.flexDirection).toBe("row-reverse");
      expect(styles.writingDirection).toBe("rtl");
    });

    it("should return LTR styles for English", () => {
      const styles = createRTLStyles("en");

      expect(styles.textAlign).toBe("left");
      expect(styles.flexDirection).toBe("row");
      expect(styles.writingDirection).toBe("ltr");
    });

    it("should return LTR styles for French", () => {
      const styles = createRTLStyles("fr");

      expect(styles.textAlign).toBe("left");
      expect(styles.flexDirection).toBe("row");
      expect(styles.writingDirection).toBe("ltr");
    });
  });
});
