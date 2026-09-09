// Upstream debug output includes access tokens, email addresses and config.
// Keep operational failures visible without writing request payloads to logs.
module.exports = {
  log() {},
  info() {},
  warn() {},
  error() { console.error('Twikoo operation failed.'); },
};
