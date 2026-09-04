sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/core/EventBus",
    "sap/base/util/UriParameters",
    "sap/f/library",
    "sap/f/FlexibleColumnLayoutSemanticHelper"
], function (UIComponent, JSONModel, XMLView, EventBus, UriParameters, fioriLibrary, FlexibleColumnLayoutSemanticHelper) {
    "use strict";

    var LayoutType = fioriLibrary.LayoutType;

    return UIComponent.extend("com.nexus.asset.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        /**
         * IAsyncContentCreation requires createContent to return a Promise.
         */
        createContent: function () {
            return XMLView.create({
                id: "idAppView",
                viewName: "com.nexus.asset.view.App",
                viewData: {
                    component: this
                }
            }).then(function (view) {
                view.setBusyIndicatorDelay(0);
                view.setBusy(true);
                window.appView = view;
                return view;
            });
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.setModel(new JSONModel());

            var oRouter = this.getRouter();
            oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
            oRouter.initialize();

            EventBus.getInstance().publish("app", "initEvents");
        },

        _onBeforeRouteMatched: function (oEvent) {
            var oModel = this.getModel();
            var sLayout = oEvent.getParameters().arguments.layout;

            if (!sLayout) {
                sLayout = this.getHelper().getNextUIState(0).layout;
            }

            oModel.setProperty("/layout", sLayout);
        },

        getHelper: function () {
            var oFCL = this.getRootControl().byId("flexibleColumnLayout");
            var oParams = UriParameters.fromQuery(window.location.search);
            var oSettings = {
                defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
                defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
                mode: oParams.get("mode"),
                maxColumnsCount: oParams.get("max")
            };

            return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
        }
    });
});
