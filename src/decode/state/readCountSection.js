/* @flow */

import type { Cursor } from "../../common";

import type { State } from "./main";

import { uint32 } from "@capnp-js/read-data";

import readLengthsSection from "./readLengthsSection";
import { COUNT_SECTION_STATE, LENGTHS_SECTION } from "./main";

//TODO: This assumes that at least 4 bytes are available.
//      I need to align its input, right?
//      I need to document thes trans-* preconditions much better.
//TODO: This function assumes quad alignment, but this could output a non-word aligned segment, right?
//      Prescribe 8-byte alignment?
export default function readCountSection(chunk: Cursor): Error | State {
  if (chunk.buffer.length === 0) {
    return COUNT_SECTION_STATE;
  }

  const count = uint32(chunk.buffer, 0) + 1;

  // #if _DEBUG
  console.log(`header prescribes ${count} segment(s)`);
  // #endif

  //TODO: Should I throw if the length of the first segment is less than 8?
  const state = {
    type: LENGTHS_SECTION,
    segmentLengths: new Uint32Array(count),
    i: 0,
  };
  chunk.i += 4;

  /* I'm temporarily word misaligned as I call `readLengthsSection`, but
     `readLengthsSection` restores word alignment. */
  return readLengthsSection(state, chunk);
}
