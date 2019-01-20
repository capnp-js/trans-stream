/* @flow */

import type { Source, Sink } from "@capnp-js/transform";

import FinishCore from "./FinishCore";

export default function finishDecode(cb: (null | Error, Array<Uint8Array>) => void): Sink<Uint8Array> {
  const core = new FinishCore();
  return function sink(source: Source<Uint8Array>): void {
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
            (finished: Array<Uint8Array>);
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
