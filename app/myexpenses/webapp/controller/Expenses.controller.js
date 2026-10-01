sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/CustomListItem",
  "sap/m/HBox",
  "sap/m/VBox",
  "sap/m/Text",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "my/expenses/util/api",
  "my/expenses/model/format",
  "my/expenses/model/categories"
], function (Controller, JSONModel, CustomListItem, HBox, VBox, Text, MessageBox, MessageToast, api, format, categories) {
  "use strict";

  function escapeOData(value) {
    return String(value).replace(/'/g, "''");
  }

  return Controller.extend("my.expenses.controller.Expenses", {
    onInit: function () {
      this._rows = [];
      this._searchTimer = null;
      this.setModel(new JSONModel({
        category: "",
        search: "",
        fromDate: "",
        toDate: "",
        categories: [{ key: "", text: "All categories" }].concat(categories)
      }), "filters");
      this.getOwnerComponent().getRouter().getRoute("expenses").attachPatternMatched(this.onRefresh, this);
    },

    setModel: function (model, name) {
      this.getView().setModel(model, name);
    },

    onRefresh: function () {
      this._load();
    },

    onFilter: function () {
      this._load();
    },

    onSearch: function (event) {
      this.getView().getModel("filters").setProperty("/search", event.getParameter("newValue") || "");
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this._load(), 250);
    },

    onClear: function () {
      const filters = this.getView().getModel("filters");
      filters.setProperty("/category", "");
      filters.setProperty("/search", "");
      filters.setProperty("/fromDate", "");
      filters.setProperty("/toDate", "");
      this.byId("search").setValue("");
      this._load();
    },

    _load: async function () {
      const page = this.byId("expensesPage");
      const filters = {
        category: this.byId("category").getSelectedKey(),
        search: this.byId("search").getValue(),
        fromDate: this.byId("fromDate").getValue(),
        toDate: this.byId("toDate").getValue()
      };
      const clauses = [];
      if (filters.category) {
        clauses.push("category eq '" + escapeOData(filters.category) + "'");
      }
      if (filters.fromDate) {
        clauses.push("date ge " + filters.fromDate);
      }
      if (filters.toDate) {
        clauses.push("date le " + filters.toDate);
      }
      if (filters.search) {
        clauses.push("contains(description,'" + escapeOData(filters.search) + "')");
      }
      let path = "Expenses?$orderby=date desc,createdAt desc&$top=1000";
      if (clauses.length) {
        path += "&$filter=" + encodeURIComponent(clauses.join(" and "));
      }
      page.setBusy(true);
      try {
        const data = await api.get(path);
        const rows = (data && data.value) || [];
        this._rows = rows.map((row) => {
          const match = categories.find((category) => category.key === row.category);
          return Object.assign({}, row, {
            amountText: format.inr(row.amount),
            dateText: format.date(row.date),
            mark: match ? match.mark : ""
          });
        });
        this._render(this._rows);
      } catch (error) {
        MessageBox.error(error.message || "Could not load expenses.");
      } finally {
        page.setBusy(false);
      }
    },

    _render: function (rows) {
      const list = this.byId("list");
      const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      this.byId("summary").setText(
        rows.length + (rows.length === 1 ? " expense" : " expenses") + " · " + format.inr(total)
      );
      this.byId("empty").setVisible(rows.length === 0);
      list.setVisible(rows.length > 0);
      list.destroyItems();
      rows.forEach((row) => {
        const item = new CustomListItem({ type: "Active" });
        item.data("id", row.ID);
        item.attachPress(this.onEdit, this);
        const mark = new VBox();
        mark.addStyleClass("catMark " + row.mark);
        const main = new VBox();
        main.addStyleClass("expenseMain");
        main.addItem(new Text({ text: row.category }));
        if (row.description) {
          main.addItem(new Text({ text: row.description }).addStyleClass("muted"));
        }
        main.addItem(new Text({ text: row.dateText }).addStyleClass("muted"));
        const rowBox = new HBox({ alignItems: "Center", justifyContent: "SpaceBetween", width: "100%" });
        rowBox.addStyleClass("expenseRow");
        rowBox.addItem(mark);
        rowBox.addItem(main);
        rowBox.addItem(new Text({ text: row.amountText }).addStyleClass("amount"));
        item.addContent(rowBox);
        list.addItem(item);
      });
    },

    onEdit: async function (event) {
      const id = event.getSource().data("id");
      const row = this._rows.find((item) => item.ID === id);
      if (!row) {
        return;
      }
      if (!this._dialog) {
        this._dialog = await this.loadFragment({ name: "my.expenses.view.ExpenseDialog" });
      }
      this.getView().setModel(new JSONModel({
        ID: row.ID,
        date: String(row.date).slice(0, 10),
        category: row.category,
        amount: String(row.amount),
        description: row.description || "",
        categories: categories
      }), "dialog");
      this._dialog.open();
    },

    onCloseDialog: function () {
      this._dialog.close();
    },

    onSaveDialog: async function () {
      const dialog = this.getView().getModel("dialog").getData();
      const amount = String(dialog.amount || "").trim();
      if (!dialog.date || !dialog.category || !(Number(amount) > 0)) {
        MessageBox.error("Date, category, and an amount greater than zero are required.");
        return;
      }
      this._dialog.setBusy(true);
      try {
        await api.patch("Expenses(" + dialog.ID + ")", {
          date: dialog.date,
          category: dialog.category,
          amount: Number(amount),
          description: dialog.description
        });
        this._dialog.close();
        MessageToast.show("Expense updated");
        this._load();
      } catch (error) {
        MessageBox.error(error.message || "Could not update the expense.");
      } finally {
        this._dialog.setBusy(false);
      }
    },

    onDelete: function () {
      const dialog = this.getView().getModel("dialog").getData();
      MessageBox.confirm("Delete this expense?", {
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.CANCEL,
        onClose: async (action) => {
          if (action !== MessageBox.Action.DELETE) {
            return;
          }
          this._dialog.setBusy(true);
          try {
            await api.remove("Expenses(" + dialog.ID + ")");
            this._dialog.close();
            MessageToast.show("Expense deleted");
            this._load();
          } catch (error) {
            MessageBox.error(error.message || "Could not delete the expense.");
          } finally {
            this._dialog.setBusy(false);
          }
        }
      });
    }
  });
});
