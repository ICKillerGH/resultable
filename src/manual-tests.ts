import * as Result from "../src/result";

interface Pipe {
  <A>(value: A): A;
  <A, B>(value: A, fn1: (input: A) => B): B;
  <A, B, C>(value: A, fn1: (input: A) => B, fn2: (input: B) => C): C;
  <A, B, C, D>(
    value: A,
    fn1: (input: A) => B,
    fn2: (input: B) => C,
    fn3: (input: C) => D
  ): D;
  <A, B, C, D, E>(
    value: A,
    fn1: (input: A) => B,
    fn2: (input: B) => C,
    fn3: (input: C) => D,
    fn4: (input: D) => E
  ): E;
}

const pipe: Pipe = (value: any, ...fns: Function[]): unknown => {
  return fns.reduce((acc, fn) => fn(acc), value);
};

async function main() {
  let user = await Result.fn(async () => {
    if (Math.random() < 0.5) {
      return Result.fail({ cause: "User not found" });
    }

    return Result.ok({ id: 1, name: "John Doe" });
  })();

  user = pipe(
    user,
    Result.tap(console.log),
    Result.tapErr((err) => {
      console.error(err);
    })
  );

  user = Result.tap(user, console.log);
  user = Result.tapErr(user, (err) => {
    console.error(err);
  });
  let mapped = Result.mapErr(user, (err) => {
    console.error("Mapping error:", err);
    return new Result.UnknownException({ cause: err });
  });
}

main().catch(console.error);
