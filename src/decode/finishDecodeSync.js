/* @flow */

import type { BytesR, BytesB } from "@capnp-js/bytes";
import type { SugarlessIterator, Finish } from "@capnp-js/transform";

import FinishCore from "./FinishCore";

export default function finish(source: SugarlessIterator<BytesR>): Array<BytesB> | Error {
  const core = new FinishCore();

  let s = source.next();
  while(!s.done) {
    const setted = core.set(s.value);
    if (setted instanceof Error) {
      return setted;
    }
    s = source.next();
  }

  if (s.done === true) {
    return core.finish();
  } else {
    (s.done: Error);
    return s.done;
  }
}
(finish: Finish<BytesR, Array<BytesB> | Error>);
