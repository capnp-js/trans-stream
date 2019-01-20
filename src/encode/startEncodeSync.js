/* @flow */

import type { SugarlessIterator, Start } from "@capnp-js/transform";

import StartCore from "./StartCore";

type Segments = $ReadOnlyArray<Uint8Array>;

export default function startEncodeSync(buffer: Uint8Array): Start<Segments, Uint8Array> {
  return function start(segments: Segments): SugarlessIterator<Uint8Array> {
    return new StartCore(buffer, segments);
  };
}
