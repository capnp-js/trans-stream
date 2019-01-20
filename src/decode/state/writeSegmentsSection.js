/* @flow */

import type { Cursor } from "../../common";

import type { SegmentsSection } from "./main";

import { DECODE_OVERFLOW_ERROR } from "../constant";

export default function writeSegmentsSection(state: SegmentsSection, chunk: Cursor): Error | SegmentsSection {
  let remainingBytes = chunk.buffer.length - chunk.i;
  let segment = state.segments[state.segmentI];
  let availableBytes = segment.length - state.i;
  while (availableBytes <= remainingBytes) {
    /* Complete segments as long as I have sufficient bytes to do so. */

    // #if _DEBUG
    console.log(`found the end of segment ${state.i}`);
    // #endif

    segment.set(chunk.buffer.subarray(chunk.i, chunk.i + availableBytes), state.i);
    chunk.i += availableBytes;
    remainingBytes -= availableBytes;

    if (state.segmentI < state.segmentLengths.length - 1) {
      availableBytes = state.segmentLengths[++state.segmentI];
      segment = new Uint8Array(availableBytes);
      state.segments.push(segment);
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

  segment.set(chunk.buffer.subarray(chunk.i), state.i);
  state.i += remainingBytes;

  return state;
}
