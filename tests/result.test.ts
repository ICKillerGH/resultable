import * as Result from "../src/result";

class TestError extends Result.BrandedError("@Test/TestError") {}

describe("BrandedError", () => {
  test("Test BrandedError fullfills requirements", () => {
    const error = new TestError();

    expect(error).toBeInstanceOf(Error);
    expect(error.__brand).toBe("@Test/TestError");
    expect(TestError.prototype.name).toBe("@Test/TestError");
  });
});
