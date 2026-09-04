"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Fiori license request timeouts", () => {
  it("sets a 120s approuter timeout on the /api/ route", () => {
    const xsApp = JSON.parse(fs.readFileSync(path.join(__dirname, "../xs-app.json"), "utf8"));
    const apiRoute = xsApp.routes.find((r) => r.source === "^/api/");
    assert.ok(apiRoute, "missing /api/ route");
    assert.equal(apiRoute.destination, "NexusAuth");
    assert.equal(apiRoute.timeout, 120000);
  });

  it("waits up to 120s for requestHash and surfaces Nexus dispatch failures while polling", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../webapp/controller/BaseController.js"),
      "utf8"
    );
    assert.match(src, /url:\s*self\.isRunninglocally\(\) \+ "\/api\/license\/requestHash"/);
    assert.match(src, /timeout:\s*120000/);
    assert.match(src, /sStatus === "failed"/);
  });
});
