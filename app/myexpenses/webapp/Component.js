sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
  "use strict";

  return UIComponent.extend("my.expenses.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      const device = new JSONModel(Device);
      device.setDefaultBindingMode("OneWay");
      this.setModel(device, "device");
      const shell = new JSONModel({
        phone: Device.system.phone || window.innerWidth < 720
      });
      shell.setDefaultBindingMode("OneWay");
      this.setModel(shell, "shell");
      UIComponent.prototype.init.apply(this, arguments);
      this.getRouter().initialize();
    }
  });
});
