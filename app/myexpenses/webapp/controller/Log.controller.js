sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "my/expenses/util/api",
  "my/expenses/model/format"
], function (Controller, MessageToast, api, format) {
  "use strict";

  const TILES = {
    "Food/Snacks": "catFood",
    "Travel": "catTravel",
    "Groceries": "catGroceries",
    "UPI": "catUpi"
  };

  return Controller.extend("my.expenses.controller.Log", {
    onInit: function () {
      this.getOwnerComponent().getRouter().getRoute("log").attachPatternMatched(this._reset, this);
      this._reset();
      const amount = this.byId("amount");
      amount.addEventDelegate({
        onAfterRendering: function () {
          const input = amount.getDomRef() && amount.getDomRef().querySelector("input");
          if (input) {
            input.setAttribute("inputmode", "decimal");
          }
        }
      });
    },

    _reset: function () {
      this._category = "";
      this.byId("date").setValue(format.localISODate());
      this.byId("amount").setValue("");
      this.byId("description").setValue("");
      this._hideMessage();
      this._markCategory("");
    },

    onCategory: function (event) {
      this._category = event.getSource().data("category");
      this._markCategory(this._category);
      this._hideMessage();
    },

    onDateChange: function () {
      this._hideMessage();
    },

    _markCategory: function (selected) {
      Object.keys(TILES).forEach((category) => {
        const button = this.byId(TILES[category]);
        const active = category === selected;
        button.toggleStyleClass("selected", active);
        button.setType(active ? "Emphasized" : "Default");
      });
    },

    _hideMessage: function () {
      const strip = this.byId("formMessage");
      strip.setVisible(false);
      strip.setText("");
    },

    _showMessage: function (text) {
      const strip = this.byId("formMessage");
      strip.setType("Error");
      strip.setText(text);
      strip.setVisible(true);
    },

    onSave: async function () {
      const date = this.byId("date").getValue();
      const amount = String(this.byId("amount").getValue() || "").trim();
      const description = this.byId("description").getValue();
      if (!date) {
        this._showMessage("Choose a date.");
        return;
      }
      if (!this._category) {
        this._showMessage("Choose a category: Food/Snacks, Travel, Groceries, or UPI.");
        return;
      }
      if (!amount || !(Number(amount) > 0)) {
        this._showMessage("Enter an amount greater than zero.");
        return;
      }
      this.byId("save").setEnabled(false);
      try {
        await api.post("Expenses", {
          date,
          category: this._category,
          amount: Number(amount),
          description: description
        });
        MessageToast.show("Expense saved");
        this.getOwnerComponent().getRouter().navTo("expenses");
      } catch (error) {
        this._showMessage(error.message || "Could not save the expense.");
      } finally {
        this.byId("save").setEnabled(true);
      }
    }
  });
});
