import fs from "fs";
import path from "path";

describe("Calculate Navigation Layout", () => {
  it("uses a nested calculate stack with detailed and setup screens", () => {
    const calculateLayoutPath = path.resolve(
      __dirname,
      "../../app/(public)/calculate/_layout.tsx",
    );
    const content = fs.readFileSync(calculateLayoutPath, "utf8");

    expect(content).toContain("<Stack");
    expect(content).toContain('name="index"');
    expect(content).toContain('name="result"');
    expect(content).toContain('name="detailed"');
    expect(content).toContain('name="detailed/setup"');
  });

  it("does not register calculate detailed/result routes as tab-level screens", () => {
    const publicLayoutPath = path.resolve(__dirname, "../../app/(public)/_layout.tsx");
    const content = fs.readFileSync(publicLayoutPath, "utf8");

    expect(content).toContain('name="calculate"');
    expect(content).not.toContain('name="calculate/index"');
    expect(content).not.toContain('name="calculate/detailed"');
    expect(content).not.toContain('name="calculate/detailed/setup"');
    expect(content).not.toContain('name="calculate/result"');
  });
});
