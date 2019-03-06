/* @flow */

import type { BytesR, BytesB } from "@capnp-js/bytes";

type uint = number;
type u32 = number;
type u35 = number;

export type Cursor = {
  buffer: BytesR,
  i: uint,
};

export type State = CountSection | LengthsSection | SegmentsSection;

export const COUNT_SECTION = "count section";

export type CountSection = {|
  +type: "count section",
|};

export const COUNT_SECTION_STATE = {
  type: COUNT_SECTION,
};

export const LENGTHS_SECTION = "lengths section";

export type LengthsSection = {|
  +type: "lengths section",
  +segmentLengths: Uint32Array,
  i: u32,
|};

export const SEGMENTS_SECTION = "segments section";

export type SegmentsSection = {|
  +type: "segments section",
  +segmentLengths: Uint32Array,
  +segments: Array<BytesB>,
  segmentI: u32,
  i: u35,
|};

// #if _DEBUG
export function debugState(state: State): string {
  switch (state.type) {
  case COUNT_SECTION:
    return `state="${COUNT_SECTION}"`;
  case LENGTHS_SECTION:
    return `state="${LENGTHS_SECTION}" with ${state.i} of ${state.segmentLengths.length} lengths`;
  default: {
    (state: SegmentsSection);

    const segmentI = state.segmentI;
    const segmentsS = `${segmentI} of ${state.segmentLengths.length} segments`;
    const segmentS = `${state.i} of ${8 * state.segmentLengths[segmentI]} bytes`;

    return `state="${SEGMENTS_SECTION}" with ${segmentsS} and ${segmentS}`;
  }
  }
}
// #endif
