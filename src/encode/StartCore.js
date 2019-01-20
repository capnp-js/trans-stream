/* @flow */

import type { SugarlessIteratorResult } from "@capnp-js/transform";

import type { State, LengthsSection } from "./state/main";

import {
  ENCODE_MIN_BUFFER_SIZE,
  ENCODE_BUFFER_SIZE_ERROR,
  ENCODE_BUFFER_WORD_ALIGNMENT_ERROR,
  ENCODE_ZERO_SEGMENTS_ERROR,
} from "./constant";

import writeCountSection from "./state/writeCountSection";
import writeLengthsSection from "./state/writeLengthsSection";
import {
  COUNT_SECTION_STATE,
  COUNT_SECTION,
} from "./state/main";

export default class StartCore {
  +buffer: Uint8Array;
  +segments: $ReadOnlyArray<Uint8Array>;
  state: State;

  constructor(buffer: Uint8Array, segments: $ReadOnlyArray<Uint8Array>) {
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

  next(): SugarlessIteratorResult<Uint8Array> {
    const chunk = {
      buffer: this.buffer,
      i: 0,
    };

    let nextState;
    switch (this.state.type) {
    case COUNT_SECTION:
      nextState = writeCountSection(this.segments, chunk);
      break;
    default:
      (this.state: LengthsSection);
      nextState = writeLengthsSection(this.segments, this.state, chunk);
    }

    if (nextState !== null) {
      this.state = nextState;
      return {
        done: false,
        value: chunk.buffer.subarray(0, chunk.i),
      };
    } else {
      return { done: true };
    }
  }
}
