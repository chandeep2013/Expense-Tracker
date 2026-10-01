sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/HBox",
  "sap/m/VBox",
  "sap/m/Text",
  "sap/m/MessageBox",
  "my/expenses/util/api",
  "my/expenses/model/format",
  "my/expenses/model/categories"
], function (Controller, JSONModel, HBox, VBox, Text, MessageBox, api, format, categories) {
  "use strict";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  return Controller.extend("my.expenses.controller.Report", {
    onInit: function () {
      this._period = "month";
      this._anchor = format.localISODate();
      this.getView().setModel(new JSONModel({
        rangeText: "",
        totalText: format.inr(0),
        countText: "",
        empty: false,
        slices: []
      }), "report");
      this.getOwnerComponent().getRouter().getRoute("reports").attachPatternMatched(this._load, this);
    },

    onAfterRendering: function () {
      if (!this._picked) {
        this.byId("anchor").setValue(this._anchor);
        this.byId("period").setSelectedKey(this._period);
        this._picked = true;
      }
    },

    onPeriod: function (event) {
      this._period = event.getParameter("item").getKey();
      this._load();
    },

    onAnchor: function (event) {
      const value = event.getParameter("value") || this.byId("anchor").getValue();
      if (!value) {
        return;
      }
      this._anchor = value;
      this._load();
    },

    _load: async function () {
      const anchor = this.byId("anchor").getValue() || this._anchor;
      this._anchor = anchor;
      const page = this.byId("reportPage");
      page.setBusy(true);
      try {
        const report = await api.getReport(this._period, anchor);
        const slices = categories.map((category) => {
          const match = (report.slices || []).find((slice) => slice.category === category.key) || {};
          return {
            category: category.key,
            total: Number(match.total || 0),
            count: Number(match.count || 0),
            totalText: format.inr(match.total || 0),
            color: category.color,
            mark: category.mark
          };
        });
        const grandTotal = Number(report.grandTotal || 0);
        this.getView().getModel("report").setData({
          rangeText: format.date(report.fromDate) + " – " + format.date(report.toDate),
          totalText: format.inr(grandTotal),
          countText: (report.count || 0) + ((report.count || 0) === 1 ? " expense" : " expenses"),
          empty: grandTotal === 0,
          slices
        });
        this._renderChart(slices, format.inr(grandTotal));
      } catch (error) {
        MessageBox.error(error.message || "Could not load the report.");
      } finally {
        page.setBusy(false);
      }
    },

    _renderChart: function (slices, totalText) {
      const total = slices.reduce((sum, slice) => sum + slice.total, 0);
      let gradient = "var(--sapTile_Background, #eaecee)";
      if (total > 0) {
        let cursor = 0;
        const stops = [];
        slices.forEach((slice) => {
          if (slice.total <= 0) {
            return;
          }
          const start = cursor;
          cursor += (slice.total / total) * 100;
          stops.push(slice.color + " " + start.toFixed(2) + "% " + cursor.toFixed(2) + "%");
        });
        gradient = "conic-gradient(" + stops.join(",") + ")";
      }
      this.byId("donut").setContent(
        '<div class="donut" style="background:' + gradient + '"><div class="donutHole"><span>' +
        escapeHtml(totalText) + "</span></div></div>"
      );

      const bars = this.byId("bars");
      bars.destroyItems();
      const max = Math.max.apply(null, slices.map((slice) => slice.total).concat(0));
      slices.forEach((slice) => {
        const width = max > 0 ? Math.max(slice.total > 0 ? 2 : 0, (slice.total / max) * 100) : 0;
        const labels = new HBox({
          justifyContent: "SpaceBetween",
          width: "100%",
          alignItems: "Center"
        });
        labels.addItem(new Text({ text: slice.category }));
        labels.addItem(new Text({ text: slice.totalText }).addStyleClass("amount"));
        const track = new VBox({ width: "100%" });
        track.addStyleClass("barTrack");
        const fill = new VBox({ width: width + "%" });
        fill.addStyleClass("barFill " + slice.mark);
        track.addItem(fill);
        const row = new VBox({ width: "100%" });
        row.addStyleClass("barRow");
        row.addItem(labels);
        row.addItem(track);
        bars.addItem(row);
      });
    },

    onDownload: async function () {
      const anchor = this.byId("anchor").getValue() || this._anchor;
      this.byId("download").setEnabled(false);
      try {
        await api.downloadReport(this._period, anchor);
      } catch (error) {
        MessageBox.error(error.message || "Could not download the report.");
      } finally {
        this.byId("download").setEnabled(true);
      }
    }
  });
});