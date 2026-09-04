"use strict";

const cds                  = require("@sap/cds");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const { getDestination }   = require("@sap-cloud-sdk/connectivity");
const nonceStore           = require("./lib/nonce-store");

const log = cds.log("license");

// Must exceed the HTML5/managed-approuter default (30s) and match the BTP
// destination timeout (90s). Outer gateway wait is 120s so this inner call
// can finish first with a real Nexus error instead of a generic 504.
const NEXUS_REQUEST_TIMEOUT_MS = 120000;

async function dispatchNexusRequestHash({ nonce, userId, postbackUrl, authHeader }) {
  try {
    const dest = await getDestination({ destinationName: "nexusPrincipalProp" });
    await executeHttpRequest(dest, {
      method:  "POST",
      url:     "/requestHash",
      params:  { postBack: postbackUrl },
      headers: { Authorization: authHeader },
      data:    "",
      timeout: NEXUS_REQUEST_TIMEOUT_MS,
    });
    log.info("requestHash dispatched to Nexus", { userId, nonce });
  } catch (err) {
    const nexusBody = err.response?.data ?? err.cause?.response?.data ?? null;
    const message   = err.message || "Nexus requestHash failed";
    nonceStore.fail(nonce, message);
    log.error("Nexus requestHash call failed (nonce still active)", {
      userId, nonce,
      httpStatus: err.response?.status ?? err.cause?.response?.status,
      nexusBody,
      message,
    });
  }
}

module.exports = cds.service.impl(async function () {

  // requestHash — create a nonce and return it immediately so the HTML5
  // managed approuter does not hit its 30s gateway timeout. Nexus is called
  // in the background; the Fiori client polls result(nonce) for the token
  // (or a dispatch failure).
  this.on("requestHash", async (req) => {
    const userId = req.user.id;

    // 1. Create nonce (5-min TTL).
    const nonce = nonceStore.create(userId);

    // 2. Build postback URL.
    //    Nonce is in the URL PATH (not query string) because Nexus strips
    //    query params before making the callback POST.
    const base = (process.env.POSTBACK_BASE || "").replace(/\/$/, "");
    const postbackUrl = base + "/nexus/callback/" + encodeURIComponent(nonce);

    // 3. Capture the incoming JWT now — the request object is gone after we return.
    const authHeader = req.http.req.headers["authorization"];

    // 4. Call Nexus without blocking this HTTP response.
    //    Destination "nexusPrincipalProp" (NoAuthentication); XSUAA Bearer is
    //    forwarded so Nexus can validate the user. Destination URL.queries.*
    //    (id, app, type, env) are appended automatically.
    void dispatchNexusRequestHash({ nonce, userId, postbackUrl, authHeader });

    return { nonce, nexusStatus: "ok" };
  });

  // result — polls nonce-store for Nexus token data.
  this.on("result", async (req) => {
    const { nonce } = req.data;
    const entry = nonceStore.get(nonce);
    if (!entry) return { status: "expired", token: "", userId: null, restEndPoint: "", jwt: "", message: "" };
    if (entry.user !== req.user.id) return req.reject(403, "wrong user");
    if (entry.status === "complete") return {
      status:       "complete",
      token:        entry.token,
      userId:       entry.userId,
      restEndPoint: entry.restEndPoint,
      jwt:          entry.jwt,
      message:      "",
    };
    if (entry.status === "failed") return {
      status:       "failed",
      token:        "",
      userId:       null,
      restEndPoint: "",
      jwt:          "",
      message:      entry.message || "Nexus requestHash failed",
    };
    return { status: "pending", token: "", userId: null, restEndPoint: "", jwt: "", message: "" };
  });

});
