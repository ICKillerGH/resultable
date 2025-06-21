import * as Result from "../src/result";

class TestError extends Result.BrandedError("@Test/TestError") {}
class TestError2 extends Result.BrandedError("@Test/TestError2") {}
class TestErrorWithArgs extends Result.BrandedError("@Test/TestErrorWithArgs")<{
  userId: number;
  message: string;
}> {}
class TestErrorWithArgs2 extends Result.BrandedError(
  "@Test/TestErrorWithArgs2"
) {}

describe("BrandedError", () => {
  test("Test BrandedError fullfills requirements", () => {
    const error = new TestError();

    expect(error).toBeInstanceOf(Error);
    expect(error.__brand).toBe("@Test/TestError");
    expect(TestError.prototype.name).toBe("@Test/TestError");
  });
});

describe("BrandedErrorWithArgs", () => {
  test("Test BrandedErrorWithArgs fullfills requirements", () => {
    const error = new TestErrorWithArgs({ userId: 1, message: "Test error" });
    const error2 = new TestErrorWithArgs2();

    expect(error).toBeInstanceOf(Error);
    expect(error.__brand).toBe("@Test/TestErrorWithArgs");
    expect(TestErrorWithArgs.prototype.name).toBe("@Test/TestErrorWithArgs");
    expect(error.userId).toBe(1);
    expect(error.message).toBe("Test error");
    expect(error2.message).toBe("An error occurred");
  });
});

describe("resultableFn types", () => {
  test("Test it only can return Result and BrandedError", async () => {
    // @ts-expect-error
    Result.resultableFn(async () => {
      return [1];
    });

    // @ts-expect-error
    Result.resultableFn(async () => {
      return [undefined, new Error()];
    });

    const okResult = await Result.resultableFn(async () => {
      return Result.ok(1);
    })();

    const errorResult = await Result.resultableFn(async () => {
      return Result.err(new TestError());
    })();

    const resultable = Result.resultableFn(
      async (succeed: boolean, failEarly: boolean = false) => {
        if (failEarly) {
          return new TestError2();
        }
        return succeed ? Result.ok(1) : Result.err(new TestError());
      }
    );

    const okResult2 = await resultable(true);
    const errorResultTestError = await resultable(false);
    const errorResultTestError2 = await resultable(true, true);

    expect(okResult[0]).toBe(1);
    expect(errorResult[1]).toBeInstanceOf(TestError);
    expect(okResult2[0]).toBe(1);
    expect(errorResultTestError[1]).toBeInstanceOf(TestError);
    expect(errorResultTestError2[1]).toBeInstanceOf(TestError2);
  });
});
