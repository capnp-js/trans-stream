/* @flow */

import type { Cursor } from "../../common";

import type { State } from "./main";

import { uint32 } from "@capnp-js/write-data";

import writeLengthsSection from "./writeLengthsSection";
import { LENGTHS_SECTION } from "./main";

type Segments = $ReadOnlyArray<Uint8Array>;

export default function writeCountSection(segments: Segments, chunk: Cursor): State | null {
  uint32(segments.length - 1, chunk.buffer, chunk.i);
  chunk.i += 4;

  /* Get word aligned again. */
  uint32(segments[0].length / 8, chunk.buffer, chunk.i);
  chunk.i += 4;

  /* I've already processed the first segment length, so the state's position
     starts at 1 instead of 0. */
  const nextState = {
    type: LENGTHS_SECTION,
    i: 1,
  };

  return writeLengthsSection(segments, nextState, chunk); 
}
