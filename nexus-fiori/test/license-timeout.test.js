"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Work Zone HTML5 routing", () => {
  const xsApp = JSON.parse(fs.readFileSync(path.join(__dirname, "../xs-app.json"), "utf8"));

  it("does not use route-level timeout (managed HTML5 runtime 500s Component.js)", () => {
    for (const route of xsApp.routes) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(route, "timeout"),
        false,
        `route ${route.source} must not set timeout`
      );
    }
  });

  it("does not keep the Fiori generator placeholder route", () => {
    assert.equal(
      xsApp.routes.some((r) => String(r.source).includes("apply-service-segment-path")),
      false
    );
  });

  it("serves Component.js from html5-apps-repo-rt as the last route", () => {
    const last = xsApp.routes[xsApp.routes.length - 1];
    assert.equal(last.source, "^(.*)$");
    assert.equal(last.service, "html5-apps-repo-rt");
  });

  it("keeps /api/ on NexusAuth without blocking static files", () => {
    const apiRoute = xsApp.routes.find((r) => r.source.startsWith("^/api"));
    assert.ok(apiRoute, "missing /api/ route");
    assert.equal(apiRoute.destination, "NexusAuth");
  });
});
