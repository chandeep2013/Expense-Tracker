sap.ui.define([], function () {
  "use strict";

  function inr(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  }

  function date(value) {
    if (!value) {
      return "";
    }
    const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  function localISODate(now) {
    const current = now || new Date();
    const local = new Date(current.getTime() - current.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  return { inr, date, localISODate };
});
