/* @flow */

import type { Cursor, LengthsSection, SegmentsSection } from "./main";

import { create } from "@capnp-js/bytes";
import { uint32 } from "@capnp-js/read-data";

import writeSegmentsSection from "./writeSegmentsSection";
import { SEGMENTS_SECTION } from "./main";

export default function readLengthsSection(state: LengthsSection, chunk: Cursor): Error | LengthsSection | SegmentsSection {
  const sectionEnd = chunk.i + 4 * (state.segmentLengths.length - state.i);
  const end = Math.min(chunk.buffer.length, sectionEnd);
  for ( ; chunk.i<end; chunk.i+=4) {
    // #if _DEBUG
    console.log(`header prescribes a segment length of ${uint32(chunk.buffer, chunk.i)} words`);
    // #endif

    state.segmentLengths[state.i++] = uint32(chunk.buffer, chunk.i);
  }

  if (state.i === state.segmentLengths.length) {
    /* I've transitioned state. I may not have reached the end of the `chunk`
       buffer, so I write segments just in case. */

    if ((state.segmentLengths.length % 2) === 0) {
      /* A count u32 plus a word aligned lengths section implies that the
         `chunk` position is not word aligned, so skip 4 bytes of padding. */

      // #if _DEBUG
      console.log("even number of segment lengths, so I skip 4 bytes of padding");
      // #endif

      chunk.i += 4;
    }

    const segments = [];
    state.segmentLengths.forEach(words => {
      segments.push(create(8 * words));
    });
    return writeSegmentsSection({
      type: SEGMENTS_SECTION,
      segmentLengths: state.segmentLengths,
      segments,
      segmentI: 0,
      i: 0,
    }, chunk);
  } else {
    /* Otherwise I have not transitioned state. I've been mutating the
       existing state object along the way, so it's ready for return. */

    return state;
  }
}
