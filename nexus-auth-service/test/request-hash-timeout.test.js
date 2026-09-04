"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("requestHash timeout handling", () => {
  it("does not await the Nexus HTTP call in the CAP action handler", () => {
    const src = fs.readFileSync(path.join(__dirname, "../srv/license-service.js"), "utf8");
    assert.match(src, /NEXUS_REQUEST_TIMEOUT_MS = 120000/);
    assert.match(src, /void dispatchNexusRequestHash\(/);
    assert.match(src, /return \{ nonce, nexusStatus: "ok" \};/);

    const handlerStart = src.indexOf('this.on("requestHash"');
    const handlerBody = src.slice(handlerStart);
    assert.equal(handlerBody.includes("await executeHttpRequest"), false);
    assert.equal(handlerBody.includes("await getDestination"), false);
  });
});
