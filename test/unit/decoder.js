/* @flow */

import type { BytesR } from "@capnp-js/bytes";

import * as assert from "assert";
import { describe, it } from "mocha";
import { create, fill, set, getSubarray } from "@capnp-js/bytes";
import { uint32 } from "@capnp-js/write-data";

import FinishCore from "../../src/decode/FinishCore";
import readCountSection from "../../src/decode/state/readCountSection";
import readLengthsSection from "../../src/decode/state/readLengthsSection";
import writeSegmentsSection from "../../src/decode/state/writeSegmentsSection";
import { LENGTHS_SECTION, SEGMENTS_SECTION } from "../../src/decode/state/main";

describe("readCountSection", function () {
  const chunk = {
    buffer: create(8),
    i: 0,
  };
  uint32(2, chunk.buffer, 0);
  const state = readCountSection(chunk);

  it("reads segment count minus one from the leading 4 bytes", function () {
    assert.equal((state: any).segmentLengths.length, 3);
  });

  it("transitions to the lengths section", function () {
    assert.equal((state: any).i, 1);
    assert.equal((state: any).type, LENGTHS_SECTION);
  });
});

describe("readLengthsSection", function () {
  describe("odd segment count", function () {
    const chunk = {
      buffer: create(8),
      i: 0,
    };
    uint32(7, chunk.buffer, 0);
    uint32(3, chunk.buffer, 4);
    let state = {
      type: LENGTHS_SECTION,
      segmentLengths: new Uint32Array(3),
      i: 1,
    };
    state.segmentLengths[0] = 8;
    state.segmentLengths[1] = 8;
    state.segmentLengths[2] = 8;
    it("reads segment lengths", function () {
      assert.equal((state: any).type, LENGTHS_SECTION);
      state = readLengthsSection((state: any), chunk);
      assert.equal((state: any).segmentLengths[1], 7);
      assert.equal((state: any).segmentLengths[2], 3);
    });
    it("transitions to the segments section", function () {
      assert.equal((state: any).type, SEGMENTS_SECTION);
    });
  });

  describe("even segment count", function () {
    const chunk = {
      buffer: create(8),
      i: 0,
    };
    let state = {
      type: LENGTHS_SECTION,
      segmentLengths: new Uint32Array(4),
      i: 1,
    };
    state.segmentLengths[0] = 56;
    state.segmentLengths[1] = 24;
    state.segmentLengths[2] = 72;
    state.segmentLengths[3] = 8;

    uint32(7, chunk.buffer, 0);
    uint32(3, chunk.buffer, 4);
    state = readLengthsSection(state, chunk);
    it("reads segment lengths", function () {
      assert.equal((state: any).type, LENGTHS_SECTION);
      assert.equal((state: any).segmentLengths[1], 7);
      assert.equal((state: any).segmentLengths[2], 3);
    });
    chunk.i = 0;
    uint32(9, chunk.buffer, 0);
    uint32(1, chunk.buffer, 4);
    it("reads another segment length", function () {
      assert.equal((state: any).type, LENGTHS_SECTION);
      state = readLengthsSection((state: any), chunk);
      assert.equal((state: any).segmentLengths[3], 9)
    });
    it("transitions to the segments section", function () {
      assert.equal((state: any).type, SEGMENTS_SECTION);
    });
  });
});

describe("writeSegmentsSection", function () {
  let state = {
    type: SEGMENTS_SECTION,
    segmentLengths: new Uint32Array(3),
    segments: [ create(24), create(40), create(8) ],
    segmentI: 0,
    i: 0,
  };
  state.segmentLengths[0] = 3;
  state.segmentLengths[1] = 5;
  state.segmentLengths[2] = 1;

  const chunk = {
    buffer: create(16),
    i: 0,
  };
  fill(0xff, 0, chunk.buffer.length, chunk.buffer);
  it("advances segments section state for each chunk", function () {
    state = writeSegmentsSection((state: any), chunk);
    assert.equal((state: any).segmentI, 0);
    assert.equal((state: any).i, 16);
    for (let i=0; i<(state: any).i; ++i) {
      assert.equal((state: any).segments[0][i], 0xff);
    }

    chunk.i = 0;
    state = writeSegmentsSection((state: any), chunk);
    assert.equal((state: any).segmentI, 1);
    assert.equal((state: any).i, 8);
    for (let i=16; i<24; ++i) {
      assert.equal((state: any).segments[0][i], 0xff);
    }
    for (let i=0; i<8; ++i) {
      assert.equal((state: any).segments[1][i], 0xff);
    }

    chunk.i = 0;
    state = writeSegmentsSection((state: any), chunk);
    assert.equal((state: any).segmentI, 1);
    assert.equal((state: any).i, 24);
    for (let i=8; i<24; ++i) {
      assert.equal((state: any).segments[1][i], 0xff);
    }

    chunk.i = 0;
    state = writeSegmentsSection((state: any), chunk);
    assert.equal((state: any).segmentI, 2);
    assert.equal((state: any).i, 0);
    for (let i=24; i<40; ++i) {
      assert.equal((state: any).segments[1][i], 0xff);
    }

    chunk.i = 8;
    state = writeSegmentsSection((state: any), chunk);
    assert.equal((state: any).segmentI, 2);
    assert.equal((state: any).i, 8);
    for (let i=0; i<8; ++i) {
      assert.equal((state: any).segments[2][i], 0xff);
    }
  });
});

describe("FinishCore", function () {
  const buffer = create(16);
  for (let i=0; i<16; ++i) {
    set(i, i, buffer);
  }

  describe("even segment count with trivial finish", function () {
    const core = new FinishCore();
    const header = create(24);
    uint32(4-1, header, 0);
    uint32(5, header, 4);
    uint32(7, header, 8);
    uint32(2, header, 12);
    uint32(12, header, 16);

    assert.ok(core.set(getSubarray(0, 8, header)));
    assert.ok(core.set(getSubarray(8, 16, header)));
    assert.ok(core.set(getSubarray(16, 24, header)));

    it("sets buffers successfully", function () {
      for (let i=0; i<5+7+2+12; i+=2) {
        assert.ok(core.set(buffer));
      }
    });

    it("finishes buffer setting to an array of raw segments", function () {
      const raws = core.finish();
      assert.ok(!(raws instanceof Error));
      for (let i=0; i<5*8; ++i) {
        assert.equal((raws: any)[0][i], i % 16);
      }
      for (let i=0; i<7*8; ++i) {
        assert.equal((raws: any)[1][i], (i+8) % 16);
      }
      for (let i=0; i<2*8; ++i) {
        assert.equal((raws: any)[2][i], i % 16);
      }
      for (let i=0; i<12*8; ++i) {
        assert.equal((raws: any)[3][i], i % 16);
      }
    });
  });

  describe("even segment count with non-trivial finish", function () {
    const core = new FinishCore();
    const header = create(24);
    uint32(4-1, header, 0);
    uint32(5, header, 4);
    uint32(7, header, 8);
    uint32(13, header, 12);
    uint32(1, header, 16);

    assert.ok(core.set(getSubarray(0, 8, header)));
    assert.ok(core.set(getSubarray(8, 16, header)));
    assert.ok(core.set(getSubarray(16, 24, header)));

    it("sets buffers successfully", function () {
      for (let i=0; i<5+7+13+1; i+=2) {
        assert.ok(core.set(buffer));
      }
    });

    it("finishes buffer setting to an array of raw segments", function () {
      const raws = core.finish();
      assert.ok(!(raws instanceof Error));
      for (let i=0; i<5*8; ++i) {
        assert.equal((raws: any)[0][i], i % 16);
      }
      for (let i=0; i<7*8; ++i) {
        assert.equal((raws: any)[1][i], (i+8) % 16);
      }
      for (let i=0; i<13*8; ++i) {
        assert.equal((raws: any)[2][i], i % 16);
      }
      for (let i=0; i<1*8; ++i) {
        assert.equal((raws: any)[3][i], (i+8) % 16);
      }
    });
  });

  describe("odd segment count with trivial finish", function () {
    const core = new FinishCore();
    const header = create(16);
    uint32(3-1, header, 0);
    uint32(5, header, 4);
    uint32(7, header, 8);
    uint32(2, header, 12);

    assert.ok(core.set(getSubarray(0, 8, header)));
    assert.ok(core.set(getSubarray(8, 16, header)));

    it("sets buffers successfully", function () {
      for (let i=0; i<5+7+2; i+=2) {
        assert.ok(core.set(buffer));
      }
    });

    it("finishes buffer setting to an array of raw segments", function () {
      const raws = core.finish();
      assert.ok(!(raws instanceof Error));
      for (let i=0; i<5*8; ++i) {
        assert.equal((raws: any)[0][i], i % 16);
      }
      for (let i=0; i<7*8; ++i) {
        assert.equal((raws: any)[1][i], (i+8) % 16);
      }
      for (let i=0; i<2*8; ++i) {
        assert.equal((raws: any)[2][i], i % 16);
      }
    });
  });

  describe("odd segment count with non-trivial finish", function () {
    const core = new FinishCore();
    const header = create(16);
    uint32(3-1, header, 0);
    uint32(5, header, 4);
    uint32(7, header, 8);
    uint32(1, header, 12);

    assert.ok(core.set(getSubarray(0, 8, (header: BytesR))));
    assert.ok(core.set(getSubarray(8, 16, (header: BytesR))));

    it("sets buffers successfully", function () {
      for (let i=0; i<5+7+1; i+=2) {
        assert.ok(core.set(buffer));
      }
    });

    it("finishes buffer setting to an array of raw segments", function () {
      const raws = core.finish();
      assert.ok(!(raws instanceof Error));
      for (let i=0; i<5*8; ++i) {
        assert.equal((raws: any)[0][i], i % 16);
      }
      for (let i=0; i<7*8; ++i) {
        assert.equal((raws: any)[1][i], (i+8) % 16);
      }
      for (let i=0; i<1*8; ++i) {
        assert.equal((raws: any)[2][i], i % 16);
      }
    });
  });
});
