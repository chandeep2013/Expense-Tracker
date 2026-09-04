"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const nonceStore = require("../srv/lib/nonce-store");

describe("nonce-store", () => {
  it("create() returns a pending nonce that get() can read", () => {
    const nonce = nonceStore.create("user@example.com");
    const entry = nonceStore.get(nonce);
    assert.ok(nonce);
    assert.equal(entry.status, "pending");
    assert.equal(entry.user, "user@example.com");
    assert.equal(entry.message, "");
  });

  it("fail() records a dispatch error for the poller", () => {
    const nonce = nonceStore.create("fail-user@example.com");
    assert.equal(nonceStore.fail(nonce, "Nexus timed out"), true);
    const entry = nonceStore.get(nonce);
    assert.equal(entry.status, "failed");
    assert.equal(entry.message, "Nexus timed out");
  });

  it("fail() does not overwrite a completed nonce", () => {
    const nonce = nonceStore.create("complete-user@example.com");
    assert.equal(nonceStore.complete(nonce, { token: "tok-1", userId: 42 }), true);
    assert.equal(nonceStore.fail(nonce, "late error"), false);
    const entry = nonceStore.get(nonce);
    assert.equal(entry.status, "complete");
    assert.equal(entry.token, "tok-1");
  });

  it("fail() on an unknown nonce returns false", () => {
    assert.equal(nonceStore.fail("does-not-exist", "nope"), false);
  });
});
