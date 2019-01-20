/* @flow */

export {
  DECODE_INCOMPLETE_ERROR,
  DECODE_OVERFLOW_ERROR,
} from "./decode/constant";

export { default as finishDecode } from "./decode/finishDecode";
export { default as finishDecodeSync } from "./decode/finishDecodeSync";

export {
  ENCODE_MIN_BUFFER_SIZE,
  ENCODE_BUFFER_SIZE_ERROR,
  ENCODE_BUFFER_WORD_ALIGNMENT_ERROR,
  ENCODE_ZERO_SEGMENTS_ERROR,
} from "./encode/constant";

export { default as startEncodeSync } from "./encode/startEncodeSync";
