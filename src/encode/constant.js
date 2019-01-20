/* @flow */

export const ENCODE_MIN_BUFFER_SIZE = 8;

export const ENCODE_BUFFER_SIZE_ERROR =
  "Cap'n Proto byte stream encode buffers require a length of at least 8 bytes.";

export const ENCODE_BUFFER_WORD_ALIGNMENT_ERROR =
  "Cap'n Proto byte stream encode buffers require a length aligned for 8 byte words.";

export const ENCODE_ZERO_SEGMENTS_ERROR =
  "Cap'n Proto byte stream encode segments must contain at least 1 segment.";
