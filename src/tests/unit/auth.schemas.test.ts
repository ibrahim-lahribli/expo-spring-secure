import { loginSchema, signupSchema } from "../../lib/auth";

describe("loginSchema", () => {
  it("should pass with valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("should fail when password is less than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must be at least 6 characters",
      );
    }
  });

  it("should fail when email is empty", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when password is empty", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("should pass with valid name, email, password, and matching confirmPassword", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when name is less than 2 characters", () => {
    const result = signupSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Name must be at least 2 characters",
      );
    }
  });

  it("should fail when passwords do not match", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      confirmPassword: "password456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmPasswordError = result.error.issues.find(
        (e) => e.path[0] === "confirmPassword",
      );
      expect(confirmPasswordError?.message).toBe("Passwords don't match");
    }
  });

  it("should fail with invalid email format", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "invalid-email",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("should fail when password is less than 6 characters", () => {
    const result = signupSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "12345",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Password must be at least 6 characters",
      );
    }
  });
});
