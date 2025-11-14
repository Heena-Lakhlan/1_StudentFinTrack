// Jest setup: polyfill Web TextEncoder/TextDecoder for environments where they're missing
// Node provides TextEncoder/TextDecoder in 'util', but jsdom test env may not expose them.
const util = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = util.TextDecoder;
}
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = global.TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = global.TextDecoder;
}
