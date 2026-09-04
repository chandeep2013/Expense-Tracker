/**
 * LicenseService — exposed at /api/license
 *
 * Requires an authenticated user (XSUAA JWT validated by @sap/xssec via CAP).
 *
 * Flow:
 *   1. requestHash() — client calls this; service creates a nonce and returns
 *      it immediately, then calls Nexus /requestHash in the background via
 *      BTP Destination "nexusPrincipalProp", forwarding the user's XSUAA
 *      Bearer token. This avoids the HTML5/managed-approuter 30s gateway timeout.
 *
 *   2. result(nonce) — client polls this every ~1.5 s until status='complete'.
 *      When Nexus POSTs the token to POST /nexus/callback, the nonce-store is
 *      updated and the next poll returns the token.
 */
@path: '/api/license'
@requires: 'authenticated-user'
service LicenseService {

  /**
   * Initiates a Nexus license-hash request.
   * Returns a nonce immediately (Nexus is called in the background).
   * Poll result(nonce) for the hash, or a dispatch failure.
   */
  action requestHash() returns {
    nonce       : String;
    nexusStatus : String;  // 'ok' | Nexus error message (e.g. postBack URL not registered)
  };

  /**
   * Poll for the result of a previous requestHash call.
   * status: 'pending' | 'complete' | 'expired' | 'failed'
   * Fields are populated only when status = 'complete'.
   *   token       — the license token to present to Nexus APIs
   *   userId      — Nexus user ID
   *   restEndPoint — Nexus REST endpoint (e.g. trial.nexusic.com)
   *   jwt         — JWT returned by Nexus for further API calls
   *   message     — error text when status = 'failed'
   */
  function result(nonce : String) returns {
    status       : String;
    token        : String;
    userId       : Integer;
    restEndPoint : String;
    jwt          : String;
    message      : String;
  };
}
