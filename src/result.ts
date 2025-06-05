import { MakeMatchObj, matchBrand } from "./match";

export const TypeId: unique symbol = Symbol.for("@Shared/BaseError");
export type TypeId = typeof TypeId;

export type BaseError<T extends string> = Error & {
  readonly [TypeId]: TypeId;
  readonly __brand: T;
};

export function BrandedError<T extends string>(
  brand: T
): new (...args: any) => BaseError<T> {
  class BaseBrandedError extends Error {
    readonly [TypeId]: TypeId = TypeId;
    readonly __brand: T = brand;
  }

  (BaseBrandedError.prototype as any).name = brand;

  return BaseBrandedError as any;
}

export class UnknownException extends BrandedError("@Shared/UnknownException") {
  constructor(public readonly cause: unknown) {
    super("Unknown error", { cause });
  }
}

export type OkResult<T> = Readonly<[value: T, error: undefined]>;
export type ErrorResult<E extends BaseError<string>> = Readonly<
  [value: undefined, error: E]
>;
export type Result<T, E extends BaseError<string>> =
  | OkResult<T>
  | ErrorResult<E>;

type ExtractOk<T> = T extends OkResult<infer U> ? U : never;
type ExtractErr<T> = T extends ErrorResult<infer E> ? E : never;

export type MergeResults<TUnion extends OkResult<any> | ErrorResult<any>> =
  ExtractErr<TUnion> extends never
    ? OkResult<ExtractOk<TUnion>>
    : ExtractOk<TUnion> extends never
    ? ErrorResult<ExtractErr<TUnion>>
    : Result<ExtractOk<TUnion>, ExtractErr<TUnion>>; // Ambos casos

type NormalizeResult<R> = R extends OkResult<infer T>
  ? R
  : R extends ErrorResult<infer E>
  ? R
  : R extends BaseError<infer E>
  ? ErrorResult<R>
  : never;

export const resultableFn = <
  Params extends any[],
  TUnion extends
    | OkResult<any>
    | ErrorResult<BaseError<string>>
    | BaseError<string>
>(
  fn: (...args: Params) => Promise<TUnion>
): ((...args: Params) => Promise<MergeResults<NormalizeResult<TUnion>>>) => {
  const callback = async (...args: Params) => {
    const result = await fn(...args);

    if (isBaseError(result)) {
      return err(result);
    }

    return result;
  };

  return callback as any;
};

export function ok<T>(value: T): OkResult<T> {
  return [value, undefined];
}

export function err<E extends BaseError<any>>(error: E): ErrorResult<E> {
  return [undefined, error];
}

export function okVoid(): OkResult<void> {
  return [undefined, undefined];
}

export function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, UnknownException>>;

export function tryCatch<T, E extends BaseError<string>>(
  fn: () => Promise<T>,
  errorFn: (cause: unknown) => E
): Promise<Result<T, E>>;

export async function tryCatch<T, E extends BaseError<string>>(
  fn: () => Promise<T>,
  errorFn?: (cause: unknown) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(errorFn?.(e) ?? (new UnknownException(e) as any));
  }
}

type Mapper<T, R> = (value: T) => R;

export function map<T, E extends BaseError<string>, R>(
  mapper: Mapper<T, R>
): (result: Result<T, E>) => Result<R, E>;

export function map<T, E extends BaseError<string>, R>(
  result: Result<T, E>,
  mapper: Mapper<T, R>
): Result<R, E>;

export function map<T, E extends BaseError<string>, R>(
  resultOrMapper: Result<T, E> | Mapper<T, R>,
  mapper?: Mapper<T, R>
) {
  const finalMapper =
    typeof resultOrMapper === "function" ? resultOrMapper : mapper!;

  const fn = (result: Result<T, E>) => {
    const [value, error] = result;

    if (error) {
      return err(error);
    }

    return ok(finalMapper(value as T));
  };

  return typeof resultOrMapper === "function" ? fn : fn(resultOrMapper);
}

export function mapErr<
  T,
  E extends BaseError<string>,
  R extends BaseError<string>
>(mapper: Mapper<E, R>): (result: Result<T, E>) => Result<T, R>;

export function mapErr<
  T,
  E extends BaseError<string>,
  R extends BaseError<string>
>(result: Result<T, E>, mapper: Mapper<E, R>): Result<T, R>;

export function mapErr<
  T,
  E extends BaseError<string>,
  R extends BaseError<string>
>(resultOrMapper: Result<T, E> | Mapper<E, R>, mapper?: Mapper<E, R>) {
  const finalMapper =
    typeof resultOrMapper === "function" ? resultOrMapper : mapper!;

  const fn = (result: Result<T, E>) => {
    const [value, error] = result;

    if (error) {
      return err(finalMapper(error as E));
    }

    return ok(value as T);
  };

  return typeof resultOrMapper === "function" ? fn : fn(resultOrMapper);
}

export function catchAllErr<T, E extends BaseError<string>, R>(
  mapper: Mapper<E, R>
): (result: Result<T, E>) => OkResult<R>;

export function catchAllErr<T, E extends BaseError<string>, R>(
  result: Result<T, E>,
  mapper: Mapper<E, R>
): OkResult<R>;

export function catchAllErr<T, E extends BaseError<string>, R>(
  resultOrMapper: Result<T, E> | Mapper<E, R>,
  mapper?: Mapper<E, R>
) {
  const finalMapper =
    typeof resultOrMapper === "function" ? resultOrMapper : mapper!;

  const fn = (result: Result<T, E>) => {
    const [value, error] = result;

    if (error) {
      return ok(finalMapper(error as E));
    }

    return ok(value as T);
  };

  return typeof resultOrMapper === "function" ? fn : fn(resultOrMapper);
}

type InferBrand<E extends BaseError<string>> = E extends BaseError<infer B>
  ? B
  : never;

export function catchAllBrands<
  T,
  E extends BaseError<string>,
  R,
  MatchObject extends MakeMatchObj<"__brand", E, R>,
  R2 extends ReturnType<MatchObject[InferBrand<E>]>
>(brandMatchers: MatchObject): (result: Result<T, E>) => OkResult<T | R2>;

export function catchAllBrands<
  T,
  E extends BaseError<string>,
  R,
  MatchObject extends MakeMatchObj<"__brand", E, R>,
  R2 extends ReturnType<MatchObject[InferBrand<E>]>
>(result: Result<T, E>, brandMatchers: MatchObject): OkResult<T | R2>;

export function catchAllBrands<
  T,
  E extends BaseError<string>,
  R,
  MatchObject extends MakeMatchObj<"__brand", E, R>,
  R2 extends ReturnType<MatchObject[InferBrand<E>]>
>(
  resultOrBrandMappers: Result<T, E> | MatchObject,
  brandMatchers?: MatchObject
): OkResult<T | R2> | ((result: Result<T, E>) => OkResult<T | R2>) {
  const isResult = (value: unknown): value is Result<T, E> =>
    Array.isArray(value);

  const finalMatchers = isResult(resultOrBrandMappers)
    ? brandMatchers!
    : resultOrBrandMappers;

  const fn = (result: Result<T, E>) => {
    const [value, error] = result;

    if (error) {
      return ok(matchBrand(error)(finalMatchers));
    }

    return ok(value as T);
  };

  return (
    isResult(resultOrBrandMappers) ? fn(resultOrBrandMappers) : fn
  ) as any;
}

export function unwrap<T>(result: OkResult<T>): T {
  return result[0];
}

export function unwrapErr<E extends BaseError<string>>(
  result: ErrorResult<E>
): E {
  return result[1];
}

export function isErr<T, E extends BaseError<string>>(
  result: Result<T, E>
): result is ErrorResult<E> {
  const [, error] = result;

  return typeof error !== "undefined" && error[TypeId] === TypeId;
}

export function isBaseError(value: unknown): value is BaseError<any> {
  return typeof value === "object" && value !== null && TypeId in value;
}

export function exhaustiveSwitchGuard(_: never): never {
  throw new Error("Exhaustive switch guard, should not have reached here.");
}
