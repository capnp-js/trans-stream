/* @flow */

import type { BytesR, BytesB } from "@capnp-js/bytes";
import type { Source, Sink } from "@capnp-js/transform";

import FinishCore from "./FinishCore";

export default function finishDecode(cb: (null | Error, Array<BytesB>) => void): Sink<BytesR> {
  const core = new FinishCore();
  return function sink(source: Source<BytesR>): void {
    source(null, function next(done, value) {
      if (done === null) {
        const setted = core.set(value);
        if (setted === true) {
          source(null, next);
        } else {
          (setted: Error);
          source(true, function () {});
          cb(setted, []);
        }
      } else {
        if (done === true) {
          const finished = core.finish();
          if (finished instanceof Error) {
            cb(finished, []);
          } else {
            (finished: Array<BytesB>);
            cb(null, finished);
          }
        } else {
          (done: Error);
          cb(done, []);
        }
      }
    });
  };
}
