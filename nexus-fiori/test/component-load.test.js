"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Component.js loads as a UI5 module", () => {
  it("does not call removed jQuery.sap APIs before sap.ui.define", () => {
    const src = fs.readFileSync(path.join(__dirname, "../webapp/Component.js"), "utf8");
    const defineAt = src.indexOf("sap.ui.define(");
    assert.ok(defineAt >= 0, "Component.js must call sap.ui.define");
    const preamble = src.slice(0, defineAt);
    assert.equal(preamble.includes("jQuery.sap.require"), false);
    assert.equal(preamble.includes("jQuery.sap.storage"), false);
    assert.match(src.trimStart(), /^sap\.ui\.define\(/);
  });

  it("executes under UI5 App Runtime async bootstrap without global jQuery", () => {
    const src = fs.readFileSync(path.join(__dirname, "../webapp/Component.js"), "utf8");
    const sandbox = {
      sap: { ui: { define: () => {} } }
    };
    const fn = new Function("sap", "jQuery", src);
    assert.doesNotThrow(() => fn(sandbox.sap, undefined));
  });

  it("declares sap.f because App.view and Component use FlexibleColumnLayout", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../webapp/manifest.json"), "utf8")
    );
    assert.ok(manifest["sap.ui5"].dependencies.libs["sap.f"]);
  });

  it("does not read the removed global oStorage in App.controller", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../webapp/controller/App.controller.js"),
      "utf8"
    );
    assert.equal(src.includes("oStorage"), false);
  });
});
