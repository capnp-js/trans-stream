/* @flow */

import type { BytesB, BytesR } from "@capnp-js/bytes";
import type { SugarlessIterator, Start } from "@capnp-js/transform";

import StartCore from "./StartCore";

type Segments = $ReadOnlyArray<BytesB>;

export default function startEncodeSync(buffer: BytesB): Start<Segments, BytesR> {
  return function start(segments: Segments): SugarlessIterator<BytesR> {
    return new StartCore(buffer, segments);
  };
}
