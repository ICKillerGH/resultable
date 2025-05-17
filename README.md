# Resultable

A small package to handle errors as values

```typescript
import { Match, Result } from "resultable";

class UserNotFound extends Result.BrandedError("UserNotFound") {}
class UserServiceUnavailable extends Result.BrandedError("UserServiceUnavailable") {}

declare const [user, userError]: Result.Result<{id: 1; name: string}, UserNotFound|UserServiceUnavailable>;

if (userError) {
    Match.matchBrand(userError)({
        "UserNotFound": () => console.log("User not found"),
        "UserServiceUnavailable": () => console.log("User service unavailable")
    })
} else {
    console.log("User", user);
}
```

# Features

- Result type in the form of a tuple [value, error]
- BrandedErrors to differentiate between different errors
- Pattern matching on errors

# Installation

```bash
npm install resultable
```

## Base types
```typescript
type BaseError<T extends string> = Error & {
  readonly [TypeId]: TypeId;
  readonly __brand: T;
};
type OkResult<T> = Readonly<[value: T, error: undefined]>;
type ErrorResult<E extends BaseError<string>> = Readonly<[value: undefined, error: E]>;
type Result<T, E extends BaseError<string>> = OkResult<T> | ErrorResult<E>;
```

## Result.BrandedError
The base error from which all resultable errors must extend. It adds a __brand readonly property to differentiate between different type of  errors.

Each "brand" must be unique to make pattern matching work, we recommend using the path of the file plus the class name for the brand, for example: Result.BrandedError("@Users/Errors/UserNotFound")

```typescript
Result.BrandedError: <T extends string>(brand: T) => new (...args: any) => BaseError<T>
```

```typescript
import { Result } from "resultable";

class UserNotFound extends Result.BrandedError("UserNotFound") {}
```

## Result.ok, Result.err, Result.okVoid
Results are just tuples with either value or error but we provide contructors to easily identify if your creating an ok result or an error result.

```typescript
import { Result } from "resultable";

const okResult = Result.ok(1);
const errResult = Result.err(new Result.UnknownException("Unkown error"));
const okVoidResult = Result.okVoid();
```

## Result.tryCatch
tryCatch is usefull to prevent functions from throwing.

It returns an UnknownException by default but you can customize the error.

```typescript
function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, UnknownException>>;

function tryCatch<T, E extends BaseError<string>>(
  fn: () => Promise<T>,
  errorFn: (cause: unknown) => E,
): Promise<Result<T, E>>;
```

```typescript
import { Result } from "resultable";

const fetchTest: Promise<Result.Result<Response, Result.UnknownException>> = Result.tryCatch(
    () => fetch("https://api.test.com")
);

class FetchError extends Result.BrandedError("FetchError") {
    constructor(public readonly cause: unknown) {
        super();
    }
}

const fetchTest2: Promise<Result.Result<Response, FetchError>> = Result.tryCatch(
    () => fetch("https://api.test.com"),
    (cause) => new FetchError(cause)
);
```

## Result.resultableFn
It's an identity function to force you to always return results

```typescript
const resultableFn: <P extends any[], TUnion extends OkResult<any> | ErrorResult<BaseError<string>>>(fn: (...args: P) => Promise<TUnion>) => ((...args: P) => Promise<MergeResults<TUnion>>)
```

```typescript
import { Result } from "resultable";

// Valid code
const createUser = Result.resultableFn(async function(name: string) {
    if (name.length < 3) {
        return Result.err(new Result.UnknownException("Name must be at least 3 characters"));
    }
    
    return Result.ok({name})
});

const userResult = await createUser("John Doe");
// userResult type -> Result.Result<{ name: string; }, Result.UnknownException>

// Invalid code
// Type Error: '{ name: string; }' is not assignable to type 'readonly [value: any, error: undefined] | readonly [value: undefined, error: BaseError<string>]'.
const createUser2 = Result.resultableFn(async function(name: string) {
    if (name.length < 3) {
        return Result.err(new Result.UnknownException("Name must be at least 3 characters"));
    }
    
    return {name}
});
```
