/* @flow */

import type { BytesR, BytesB } from "@capnp-js/bytes";
import type { SugarlessIteratorResult } from "@capnp-js/transform";

import type { State, LengthsSection } from "./state/main";

import { getSubarray } from "@capnp-js/bytes";

import {
  ENCODE_MIN_BUFFER_SIZE,
  ENCODE_BUFFER_SIZE_ERROR,
  ENCODE_BUFFER_WORD_ALIGNMENT_ERROR,
  ENCODE_ZERO_SEGMENTS_ERROR,
} from "./constant";

import writeCountSection from "./state/writeCountSection";
import writeLengthsSection from "./state/writeLengthsSection";
// #if _DEBUG
import { debugState } from "./state/main";
// #endif
import {
  COUNT_SECTION_STATE,
  COUNT_SECTION,
} from "./state/main";

type Segments = $ReadOnlyArray<BytesR>;

export default class StartCore {
  +buffer: BytesB;
  +segments: Segments;
  state: null | State;

  constructor(buffer: BytesB, segments: Segments) {
    if (buffer.length < ENCODE_MIN_BUFFER_SIZE) {
      throw new Error(ENCODE_BUFFER_SIZE_ERROR);
    }

    if (buffer.length % 8) {
      throw new Error(ENCODE_BUFFER_WORD_ALIGNMENT_ERROR);
    }

    if (segments.length < 1) {
      throw new Error(ENCODE_ZERO_SEGMENTS_ERROR);
    }

    this.buffer = buffer;
    this.segments = segments;
    this.state = COUNT_SECTION_STATE;
  }

  next(): SugarlessIteratorResult<BytesR> {
    // #if _DEBUG
    console.log("\n***** next() beginning *****");
    if (this.state === null) {
      console.log("null state");
    } else {
      console.log(`${debugState(this.state)}`);
    }
    // #endif

    const chunk = {
      buffer: this.buffer,
      i: 0,
    };

    if (this.state === null) {
      return { done: true };
    } else {
      switch (this.state.type) {
      case COUNT_SECTION:
        this.state = writeCountSection(this.segments, chunk);
        break;
      default:
        (this.state: LengthsSection);
        this.state = writeLengthsSection(this.segments, this.state, chunk);
      }

      return {
        done: false,
        value: getSubarray(0, chunk.i, chunk.buffer),
      };
    }
  }
}
