sap.ui.define([], function () {
  "use strict";

  const base = "/odata/v4/expenses/";
  let csrfToken;

  function errorMessage(payload, fallback) {
    const message = payload && payload.error && payload.error.message;
    if (!message) {
      return fallback || "Request failed";
    }
    return typeof message === "string" ? message : (message.value || fallback);
  }

  async function ensureCsrf() {
    if (csrfToken) {
      return csrfToken;
    }
    const response = await fetch(base, {
      headers: { "x-csrf-token": "Fetch", "Accept": "application/json" }
    });
    csrfToken = response.headers.get("x-csrf-token") || "";
    return csrfToken;
  }

  async function send(method, path, body) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (method !== "GET" && method !== "HEAD") {
      const token = await ensureCsrf();
      if (token) {
        headers["x-csrf-token"] = token;
      }
    }
    const response = await fetch(base + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (response.status === 403 && method !== "GET") {
      csrfToken = "";
    }
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = text;
      }
    }
    if (!response.ok) {
      const failure = new Error(errorMessage(data, response.statusText));
      failure.status = response.status;
      throw failure;
    }
    return data;
  }

  function unwrapValue(data) {
    if (data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, "value") && !Array.isArray(data.value)) {
      const keys = Object.keys(data).filter((key) => !key.startsWith("@"));
      if (keys.length === 1) {
        return data.value;
      }
    }
    return data;
  }

  return {
    get: (path) => send("GET", path),
    post: (path, body) => send("POST", path, body),
    patch: (path, body) => send("PATCH", path, body),
    remove: (path) => send("DELETE", path),

    loggedOn: async function (day) {
      const data = await send("GET", "loggedOn(day=" + day + ")");
      return !!unwrapValue(data);
    },

    getReport: function (period, anchor) {
      return send("GET", "getReport(period='" + period + "',anchor=" + anchor + ")");
    },

    downloadReport: async function (period, anchor) {
      const response = await fetch(
        "/api/expenses/report.xlsx?period=" + encodeURIComponent(period) + "&anchor=" + encodeURIComponent(anchor)
      );
      if (!response.ok) {
        throw new Error("Could not download the report");
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "myexpenses-" + period + "-" + anchor + ".xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };
});