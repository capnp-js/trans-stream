/* @flow */

import type { Cursor, SegmentsSection } from "./main";

import { getSubarray, setSubarray } from "@capnp-js/bytes";

import { DECODE_OVERFLOW_ERROR } from "../constant";

// #if _DEBUG
import { debugState } from "./main";
// #endif

export default function writeSegmentsSection(state: SegmentsSection, chunk: Cursor): Error | SegmentsSection {
  // #if _DEBUG
  console.log("\n***** writeSegmentsSection(state, chunk) beginning *****");
  console.log(`${debugState(state)}`);
  // #endif

  let remainingBytes = chunk.buffer.length - chunk.i;
  let segment = state.segments[state.segmentI];
  let availableBytes = segment.length - state.i;
  while (availableBytes <= remainingBytes) {
    /* Complete segments as long as I have sufficient bytes to do so. */

    // #if _DEBUG
    console.log(`found the end of segment ${state.i}`);
    // #endif

    setSubarray(getSubarray(chunk.i, chunk.i + availableBytes, chunk.buffer), state.i, segment);
    chunk.i += availableBytes;
    remainingBytes -= availableBytes;

    if (state.segmentI < state.segmentLengths.length - 1) {
      availableBytes = 8 * state.segmentLengths[++state.segmentI];
      segment = state.segments[state.segmentI];
      state.i = 0;
    } else {
      /* I'm out of segments. Any remaining bytes don't have a segment to
         host them. */

      // #if _DEBUG
      console.log(`ran out of segments with remainingBytes=${remainingBytes}`);
      // #endif

      state.i += availableBytes;
      if (remainingBytes === 0) {
        return state;
      } else {
        return new Error(DECODE_OVERFLOW_ERROR);
      }
    }
  }

  setSubarray(getSubarray(chunk.i, chunk.buffer.length, chunk.buffer), state.i, segment);
  state.i += remainingBytes;

  return state;
}
