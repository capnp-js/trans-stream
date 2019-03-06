/* @flow */

import type { BytesR, BytesB } from "@capnp-js/bytes";

import type { State, SegmentsSection } from "./state/main";

import readCountSection from "./state/readCountSection";
import readLengthsSection from "./state/readLengthsSection";
import writeSegmentsSection from "./state/writeSegmentsSection";
import { DECODE_INCOMPLETE_ERROR } from "./constant";
// #if _DEBUG
import { debugState } from "./state/main";
// #endif
import {
  COUNT_SECTION_STATE,
  COUNT_SECTION,
  LENGTHS_SECTION,
  SEGMENTS_SECTION,
} from "./state/main";

export default class FinishCore {
  state: State;

  constructor() {
    this.state = COUNT_SECTION_STATE;
  }

  set(buffer: BytesR): true | Error {
    // #if _DEBUG
    console.log("\n***** set(buffer) beginning *****");
    console.log(`${debugState(this.state)}`);
    // #endif

    const chunk = {
      buffer,
      i: 0,
    };

    let update;
    switch (this.state.type) {
    case COUNT_SECTION:
      update = readCountSection(chunk);
      break;
    case LENGTHS_SECTION:
      update = readLengthsSection(this.state, chunk);
      break;
    default:
      (this.state: SegmentsSection);
      update = writeSegmentsSection(this.state, chunk);
    }

    if (update instanceof Error) {
      return update;
    } else {
      this.state = update;
      return true;
    }
  }

  finish(): Array<BytesB> | Error {
    // #if _DEBUG
    console.log("\n***** finish() beginning *****");
    console.log(`${debugState(this.state)}`);
    // #endif

    if (this.state.type !== SEGMENTS_SECTION) {
      return new Error(DECODE_INCOMPLETE_ERROR);
    } else {
      (this.state: SegmentsSection);

      const segmentI = this.state.segmentI;
      const count = this.state.segmentLengths.length;
      if (segmentI === count - 1) {
        const i = this.state.i;
        if (i === 8 * this.state.segmentLengths[segmentI]) {
          return this.state.segments;
        }
      }

      return new Error(DECODE_INCOMPLETE_ERROR);
    }
  }
}
