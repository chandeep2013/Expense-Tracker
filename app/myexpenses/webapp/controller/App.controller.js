sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Text",
  "sap/ui/Device",
  "my/expenses/util/api",
  "my/expenses/model/format"
], function (Controller, Dialog, Button, Text, Device, api, format) {
  "use strict";

  return Controller.extend("my.expenses.controller.App", {
    onInit: function () {
      this._applyShell = this._applyShell.bind(this);
      this._applyShell();
      window.addEventListener("resize", this._applyShell);
      this._section = "log";
      this._onVisibleHandler = this._onVisible.bind(this);
      this.getOwnerComponent().getRouter().attachRouteMatched(this._onRoute, this);
      document.addEventListener("visibilitychange", this._onVisibleHandler);
    },

    onExit: function () {
      window.removeEventListener("resize", this._applyShell);
      document.removeEventListener("visibilitychange", this._onVisibleHandler);
    },

    _applyShell: function () {
      const phone = Device.system.phone || window.innerWidth < 720;
      this.getOwnerComponent().getModel("shell").setProperty("/phone", phone);
      document.documentElement.classList.toggle("myexpenses-phone", phone);
      const toolPage = this.byId("toolPage");
      if (phone && toolPage) {
        toolPage.setSideExpanded(false);
      }
    },

    onToggleSide: function () {
      const toolPage = this.byId("toolPage");
      toolPage.setSideExpanded(!toolPage.getSideExpanded());
    },

    onSideNav: function (event) {
      const key = event.getParameter("item").getKey();
      if (key && key !== this._section) {
        this._go(key);
      }
    },

    onPhoneNav: function (event) {
      const section = event.getSource().data("section");
      if (section && section !== this._section) {
        this._go(section);
      }
    },

    _go: function (section) {
      this.getOwnerComponent().getRouter().navTo(section);
      if (Device.system.phone) {
        this.byId("toolPage").setSideExpanded(false);
      }
    },

    _onRoute: function (event) {
      const name = event.getParameter("name");
      this._section = name;
      const side = this.byId("sideNav");
      if (side) {
        side.setSelectedKey(name);
      }
      ["log", "expenses", "reports"].forEach((section) => {
        const button = this.byId("tab" + section.charAt(0).toUpperCase() + section.slice(1));
        if (button) {
          button.setType(section === name ? "Emphasized" : "Transparent");
        }
      });
      this._maybeRemind();
    },

    _onVisible: function () {
      if (document.visibilityState !== "visible") {
        return;
      }
      const today = format.localISODate();
      if (this._reminderDay && this._reminderDay !== today) {
        this._reminderDay = null;
        this._maybeRemind();
      }
    },

    _maybeRemind: function () {
      const today = format.localISODate();
      if (this._reminderDay === today) {
        return;
      }
      this._reminderDay = today;
      this._checkReminder(today);
    },

    _checkReminder: async function (today) {
      const key = "myexpenses.reminder.dismissed." + today;
      if (sessionStorage.getItem(key)) {
        return;
      }
      try {
        if (await api.loggedOn(today)) {
          return;
        }
      } catch (error) {
        this._reminderDay = null;
        return;
      }
      if (sessionStorage.getItem(key) || this._reminderOpen) {
        return;
      }
      this._openReminder(today);
    },

    _openReminder: function (today) {
      if (!this._reminder) {
        this._reminder = new Dialog({
          title: "Log today's expenses",
          type: "Message",
          state: "Information",
          content: new Text({
            text: "Nothing is logged for today. Add an expense so your reports stay up to date. This reminder stays dismissed for this visit and shows again tomorrow."
          }).addStyleClass("reminderText"),
          beginButton: new Button({
            text: "Log an expense",
            type: "Emphasized",
            press: () => this._dismissReminder(true)
          }),
          endButton: new Button({
            text: "Dismiss",
            press: () => this._dismissReminder(false)
          })
        });
        this.getView().addDependent(this._reminder);
      }
      this._reminderOpen = true;
      this._reminderToday = today;
      this._reminder.open();
    },

    _dismissReminder: function (goToLog) {
      const today = this._reminderToday || format.localISODate();
      sessionStorage.setItem("myexpenses.reminder.dismissed." + today, "1");
      this._reminderOpen = false;
      if (this._reminder) {
        this._reminder.close();
      }
      if (goToLog && this._section !== "log") {
        this._go("log");
      }
    }
  });
});
