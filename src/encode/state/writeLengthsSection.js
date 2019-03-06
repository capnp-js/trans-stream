/* @flow */

import type { BytesR } from "@capnp-js/bytes";

import type { Cursor, LengthsSection } from "./main";

import { set } from "@capnp-js/bytes";
import { uint32 } from "@capnp-js/write-data";

type Segments = $ReadOnlyArray<BytesR>;

export default function writeLengthsSection(segments: Segments, state: LengthsSection, chunk: Cursor): LengthsSection | null {
  const lengthsEnd = 4 * (segments.length - state.i);
  const remainingBytes = chunk.buffer.length - chunk.i;
  const end = Math.min(remainingBytes, lengthsEnd);
  for ( ; chunk.i<end; chunk.i+=4) {
    uint32(segments[state.i++].length / 8, chunk.buffer, chunk.i);
  }

  if (state.i < segments.length) {
    /* I've still got more segment lengths to process. */
    return state;
  } else {
    /* I've found the end of the lengths section. */
    if (chunk.i % 8) {
      /* Pad the lengths section with zeros if it's not word aligned. */
      set(0, chunk.i++, chunk.buffer);
      set(0, chunk.i++, chunk.buffer);
      set(0, chunk.i++, chunk.buffer);
      set(0, chunk.i++, chunk.buffer);
    }

    return null;
  }
}
