(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Fisheye2Perspective", "./Fisheye2Equirectangular", "./Equirectangular2Fisheye", "./Fisheye"], factory);
    }
})(function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(require("./Fisheye2Perspective"));
    __export(require("./Fisheye2Equirectangular"));
    __export(require("./Equirectangular2Fisheye"));
    __export(require("./Fisheye"));
});
