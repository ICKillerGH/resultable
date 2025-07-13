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

describe("fn types", () => {
  test("Test it only can return Result and BrandedError", async () => {
    // @ts-expect-error
    Result.fn(async () => {
      return [1];
    });

    // @ts-expect-error
    Result.fn(async () => {
      return [undefined, new Error()];
    });

    const okResult = await Result.fn(async () => {
      return Result.ok(1);
    })();

    const errorResult = await Result.fn(async () => {
      return Result.err(new TestError());
    })();

    const resultable = Result.fn(
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

describe("catchAllErr", () => {
  describe("catchAllErr catch error", () => {
    test("Test catchAllErr works correctly", () => {
      const _0 = Result.err(new TestError());

      const result = Result.catchAllErr(
        _0,
        () => "There was an error!" as const
      );

      expect(result).toEqual(Result.ok("There was an error!"));
    });
  });

  describe("catchAllErr ignore on ok", () => {
    test("Test catchAllErr works correctly", () => {
      const _0 = Result.ok(1);

      const result = Result.catchAllErr(
        _0,
        () => "There was an error!" as const
      );

      expect(result).toEqual(Result.ok(1));
    });
  });
});

describe("catchAllBrands", () => {
  describe("catchAllBrands catch error", () => {
    test("Test catchAllBrands works correctly", () => {
      const result = Result.catchAllBrands(Result.err(new TestError()), {
        "@Shared/UnknownException": () => "Unknown exception occurred" as const,
        "@Test/TestError": () => "Test error occurred" as const,
      });
      const result2 = Result.catchAllBrands(
        Result.err(new Result.UnknownException()),
        {
          "@Shared/UnknownException": () =>
            "Unknown exception occurred" as const,
          "@Test/TestError": () => "Test error occurred" as const,
        }
      );

      expect(result).toEqual(Result.ok("Test error occurred"));
      expect(result2).toEqual(Result.ok("Unknown exception occurred"));
    });
  });

  describe("catchAllBrands ignore on ok", () => {
    test("Test catchAllBrands works correctly", async () => {
      const _0 = await Result.tryCatch(() => Promise.resolve(1));

      const result = Result.catchAllBrands(_0, {
        "@Shared/UnknownException": () => "Unknown exception occurred" as const,
      });

      expect(result).toEqual(Result.ok(1));
    });
  });
});

describe("mapErr", () => {
  test("Test mapErr works correctly", () => {
    const _0 = Result.err(new TestError());

    const result = Result.mapErr(_0, (err) => {
      expect(err).toBeInstanceOf(TestError);
      return new TestErrorWithArgs({ userId: 1, message: "Test error" });
    });

    expect(result).toEqual(
      Result.err(new TestErrorWithArgs({ userId: 1, message: "Test error" }))
    );
  });
});