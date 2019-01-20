/* @flow */

export type State = CountSection | LengthsSection;

export const COUNT_SECTION = "count section";

export type CountSection = {|
  +type: "count section",
|};

export const COUNT_SECTION_STATE = {
  type: COUNT_SECTION,
};

type u32 = number;

export const LENGTHS_SECTION = "lengths section";

export type LengthsSection = {|
  +type: "lengths section",
  i: u32,
|};

// #if _DEBUG
export function debugState(state: State): string {
  switch (state.type) {
  case COUNT_SECTION:
    return `state="${COUNT_SECTION}"`;
  default:
    (state: LengthsSection);
    return `state="${LENGTHS_SECTION}" with {state.i} lengths currently output`;
  }
}
// #endif
