/* @flow */

import * as assert from "assert";
import { describe, it } from "mocha";
import { uint32 } from "@capnp-js/read-data";
import { nonnull } from "@capnp-js/nullary";

import StartCore from "../../src/encode/StartCore";
import writeCountSection from "../../src/encode/state/writeCountSection";
import writeLengthsSection from "../../src/encode/state/writeLengthsSection";
import { LENGTHS_SECTION } from "../../src/encode/state/main";

const oddSegments = [ new Uint8Array(32), new Uint8Array(8), new Uint8Array(24) ];
const evenSegments = oddSegments.slice(0);
evenSegments.push(new Uint8Array(64));

describe("writeCountSection", function () {
  it("writes the segment count minus one to the leading 4 bytes", function () {
    {
      const chunk = {
        buffer: new Uint8Array(8),
        i: 0,
      };
      writeCountSection(oddSegments, chunk);
      assert.equal(uint32(chunk.buffer, 0), 3-1);
    }

    {
      const chunk = {
        buffer: new Uint8Array(8),
        i: 0,
      };
      writeCountSection(evenSegments, chunk);
      assert.equal(uint32(chunk.buffer, 0), 4-1);
    }
  });

  it("transitions to the lengths section", function () {
    {
      const chunk = {
        buffer: new Uint8Array(8),
        i: 0,
      };
      const state = writeCountSection(oddSegments, chunk);
      assert.equal(nonnull(state).type, LENGTHS_SECTION);
    }

    {
      const chunk = {
        buffer: new Uint8Array(8),
        i: 0,
      };
      const state = writeCountSection(evenSegments, chunk);
      assert.equal(nonnull(state).type, LENGTHS_SECTION);
    }
  });
});

describe("writeLengthsSection", function () {
  it("writes segment lengths", function () {
    {
      const chunk = {
        buffer: new Uint8Array(8),
        i: 0,
      };
      const state = writeLengthsSection(oddSegments, { type: LENGTHS_SECTION, i: 1 }, chunk);
      assert.equal(uint32(chunk.buffer, 0), oddSegments[1].length / 8);
      assert.equal(uint32(chunk.buffer, 4), oddSegments[2].length / 8);
      assert.equal(state, null);
      assert.equal(chunk.i, 8);
    }

    {
      const chunk = {
        buffer: new Uint8Array(8),
        i: 0,
      };
      let state = writeLengthsSection(evenSegments, { type: LENGTHS_SECTION, i: 1 }, chunk);
      assert.equal(uint32(chunk.buffer, 0), evenSegments[1].length / 8);
      assert.equal(uint32(chunk.buffer, 4), evenSegments[2].length / 8);
      assert.equal(nonnull(state).type, LENGTHS_SECTION);
      assert.equal(nonnull(state).i, 3);
      assert.equal(chunk.i, 8);

      chunk.i = 0;
      state = writeLengthsSection(evenSegments, nonnull(state), chunk);
      assert.equal(uint32(chunk.buffer, 0), evenSegments[3].length / 8);
      assert.equal(state, null);
    }
  });

  it("zero pads even segment counts", function () {
    {
      const chunk = {
        buffer: new Uint8Array(24),
        i: 0,
      };
      let state = writeLengthsSection(evenSegments, { type: LENGTHS_SECTION, i: 1 }, chunk);
      assert.equal(uint32(chunk.buffer, 0), evenSegments[1].length / 8);
      assert.equal(uint32(chunk.buffer, 4), evenSegments[2].length / 8);
      assert.equal(uint32(chunk.buffer, 8), evenSegments[3].length / 8);
      assert.equal(uint32(chunk.buffer, 12), 0);
      assert.equal(state, null);
      assert.equal(chunk.i, 16);
    }
  });
});

describe("StartCore", function () {
  it("rejects insufficiently sized buffers", function () {
    assert.throws(() => new StartCore(new Uint8Array(0), oddSegments));
  });

  it("rejects buffers with lengths that are not some multiple of 8", function () {
    assert.throws(() => new StartCore(new Uint8Array(9), oddSegments));
  });

  it("rejects segment counts of 0", function () {
    assert.throws(() => new StartCore(new Uint8Array(16), []));
  });

  describe("next", function () {
    describe("odd segments", function () {
      const core = new StartCore(new Uint8Array(8), oddSegments);
      let i = core.next();
      let value = (i: any).value;
      it("exposes segment count", function () {
        assert.equal(i.done, false);
        assert.equal(uint32(value, 0), 3-1);
      });

      it("exposes segment lengths", function () {
        assert.equal(uint32(value, 4), oddSegments[0].length / 8);
        i = core.next();
        assert.equal(uint32(value, 0), oddSegments[1].length / 8);
        assert.equal(uint32(value, 4), oddSegments[2].length / 8);
      });

      it("ends after exposing the full header", function () {
        i = core.next();
        assert.equal(i.done, true);
      });
    });

    describe("even segments", function () {
      const core = new StartCore(new Uint8Array(8), evenSegments);
      let i = core.next();
      let value = (i: any).value;
      it("exposes segment count", function () {
        assert.equal(i.done, false);
        assert.equal(uint32(value, 0), 4-1);
      });

      it("exposes segment lengths", function () {
        assert.equal(uint32(value, 4), evenSegments[0].length / 8);
        i = core.next();
        assert.equal(i.done, false);
        value = (i: any).value;
        assert.equal(uint32(value, 0), evenSegments[1].length / 8);
        assert.equal(uint32(value, 4), evenSegments[2].length / 8);
        i = core.next();
        assert.equal(i.done, false);
        value = (i: any).value;
        assert.equal(uint32(value, 0), evenSegments[3].length / 8);
      });

      it("0 pads the lengths section to 8 byte alignment", function () {
        assert.equal(uint32(value, 4), 0);
      })

      it("ends after exposing the full header", function () {
        i = core.next();
        assert.equal(i.done, true);
      });
    });
  });
});
