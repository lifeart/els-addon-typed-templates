"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var component_1 = require("@glimmer/component");
var MyComponent = /** @class */ (function (_super) {
    __extends(MyComponent, _super);
    function MyComponent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 1;
        _this.noob = 2;
        _this.userName = 3;
        _this.item = {
            name: 'boo',
            age: 42
        };
        return _this;
    }
    MyComponent.prototype.names = function () {
    };
    return MyComponent;
}(component_1["default"]));
exports["default"] = MyComponent;
