// # Resultable
import * as Result from "../src/result";
import * as Match from "../src/match";

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


// ## Base types
type BaseError<T extends string> = Error & {
  readonly [Result.TypeId]: Result.TypeId;
  readonly __brand: T;
};
type OkResult<T> = Readonly<[value: T, error: undefined]>;
type ErrorResult<E extends BaseError<string>> = Readonly<[value: undefined, error: E]>;
type Result<T, E extends BaseError<string>> = OkResult<T> | ErrorResult<E>;

// ### Basic Branded Error
// class UserNotFound extends Result.BrandedError("UserNotFound") {}

// new UserNotFound();


// ### Branded Error with args
// class UserNotFound extends Result.BrandedError("UserNotFound")<{userId: number}> {}

// new UserNotFound();
// -> Type Error: An argument for 'args' was not provided.

// new UserNotFound({ userId: 1 });


// ## Result.ok, Result.err, Result.okVoid, Result.fail
const okResult = Result.ok(1);
const okVoidResult = Result.okVoid();
const errResult = Result.err(new Result.UnknownException());
const failedResult = Result.fail();


// ## Result.tryCatch
const fetchTest = Result.tryCatch(
    () => fetch("https://api.test.com")
);

class FetchError extends Result.BrandedError("FetchError") {
    constructor(public readonly cause: unknown) {
        super();
    }
}

const fetchTest2 = Result.tryCatch(
    () => fetch("https://api.test.com"),
    (cause) => new FetchError(cause)
);

// ## Result.resultableFn
const createUser = Result.resultableFn(async function(name: string) {
    if (name.length < 3) {
        return Result.err(new Result.UnknownException({message: "Name must be at least 3 characters"}));
    }

    if (name === "not-allowed") {
        return new Result.UnknownException({message: "Name not allowed"});
    }
    
    return Result.ok({name})
});

// const userResult = await createUser("John Doe");

// const createUser2 = Result.resultableFn(async function(name: string) {
//     if (name.length < 3) {
//         return Result.err(new Result.UnknownException({message: "Name must be at least 3 characters"}));
//     }
    
//     return { name }
// });
