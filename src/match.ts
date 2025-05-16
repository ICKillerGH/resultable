/**
 * Describes the match object, where the keys are the discriminant ids, and the values
 * are the functions which handle the value
 */
export type MakeMatchObj<D extends string, ADT extends Record<D, string>, Z> = {
  [K in ADT[D]]: (v: MakeADTMember<D, ADT, K>) => Z;
};

/**
 * Unions all the return types of matcher functions
 */
export type MakeReturns<
  D extends string,
  ADT extends Record<D, string>,
  M extends MakeMatchObj<D, ADT, unknown>,
> = {
  [K in keyof M]: ReturnType<M[K]>;
}[keyof M];

/**
 * Helper type for extracting a member from an ADT
 */
export type MakeADTMember<D extends string, ADT, Type extends string> = Extract<
  ADT,
  Record<D, Type>
>;

// export function makeMatchI<D extends string>(
//   d: D,
// ): <ADT extends Record<D, string>>(
//   v: ADT,
// ) => <M extends MakeMatchObj<D, ADT, unknown>>(matchObj: M) => MakeReturns<D, ADT, M> {
//   return (v) => (matchObj) => matchObj[v[d]](v as any) as any;
// }
export function makeMatchI<D extends string>(d: D) {
  return <ADT extends Record<D, string>>(v: ADT) => {
    return <M extends MakeMatchObj<D, ADT, unknown>>(matchObj: M): MakeReturns<D, ADT, M> => {
      return matchObj[v[d]](v as any) as any;
    };
  };
}
export const matchBrand = makeMatchI("__brand");
