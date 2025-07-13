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

Each "brand" must be unique to allow pattern matching to work, we recommend using the path of the file plus the class name for the brand, for example: Result.BrandedError("@Users/Errors/UserNotFound")

```typescript
Result.BrandedError: <T extends string>(brand: T) => new <Args extends Record<string, any> = {}>(
  args: Equals<Args, {}> extends true
    ? void
    : { readonly [P in keyof Args as P extends "__brand" ? never : P]: Args[P] }
) => BaseError<T> & Args
```

### Basic Branded Error
```typescript
import { Result } from "resultable";

class UserNotFound extends Result.BrandedError("UserNotFound") {}

new UserNotFound();
```

### Branded Error with args
```typescript
import { Result } from "resultable";

class UserNotFound extends Result.BrandedError("UserNotFound")<{userId: number}> {}

new UserNotFound();
// -> Type Error: An argument for 'args' was not provided.

new UserNotFound({ userId: 1 });
```

## Result.ok, Result.err, Result.okVoid, Result.fail
Results are just tuples with either value or error but we provide utility functions to easily identify if your creating an ok result or an error result.

```typescript
import { Result } from "resultable";

const okResult = Result.ok(1);
const okVoidResult = Result.okVoid();
const errResult = Result.err(new Result.UnknownException());
const failedResult = Result.fail();
// -> Equivalent to Result.err(new Result.UnknownException());
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

const fetchTest = Result.tryCatch(
    () => fetch("https://api.test.com")
);
// -> Type: Promise<Result.Result<Response, Result.UnknownException>>

class FetchError extends Result.BrandedError("FetchError") {
    constructor(public readonly cause: unknown) {
        super();
    }
}

const fetchTest2 = Result.tryCatch(
    () => fetch("https://api.test.com"),
    (cause) => new FetchError(cause)
);
// -> Type: Promise<Result.Result<Response, FetchError>>
```

## Result.resultableFn
It's an identity function to force you to always return results or branded errors

```typescript
const resultableFn: <Params extends any[], TUnion extends OkResult<any> | ErrorResult<BaseError<string>> | BaseError<string>>(fn: (...args: Params) => Promise<TUnion>) => ((...args: Params) => Promise<MergeResults<NormalizeResult<TUnion>>>)
```

```typescript
import { Result } from "resultable";

// Valid code
const createUser = Result.resultableFn(async function(name: string) {
    if (name.length < 3) {
        return Result.err(new Result.UnknownException({message: "Name must be at least 3 characters"}));
    }

    if (name === "not-allowed") {
        return new Result.UnknownException({message: "Name not allowed"});
    }
    
    return Result.ok({name})
});

const userResult = await createUser("John Doe");
// -> Type: Result.Result<{ name: string; }, Result.UnknownException>

// Invalid code
const createUser2 = Result.resultableFn(async function(name: string) {
    if (name.length < 3) {
        return Result.err(new Result.UnknownException({message: "Name must be at least 3 characters"}));
    }
    
    return { name }
});
// -> Type Error: '{ name: string; }' is not assignable to type 'readonly [value: any, error: undefined] | readonly [value: undefined, error: BaseError<string>]'.
```
