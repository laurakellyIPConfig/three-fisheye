"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("./");
var dat = require("dat-gui");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var video, cam, dragging, cam2, gui;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    video = document.createElement('video');
                    video.height = 480;
                    video.width = 640;
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            video.src = "./test3.mov";
                            video.autoplay = true;
                            video.onplay = resolve;
                            video.onerror = reject;
                        })];
                case 1:
                    _a.sent();
                    document.body.appendChild(video);
                    cam = new _1.Fisheye2Perspective();
                    window["cam"] = cam;
                    cam.src = video;
                    cam.canvasSize = { width: 600, height: 400 };
                    cam.cameraPose = { pitch: Math.PI / 4, yaw: 0 };
                    cam.zoom = 1 / 3;
                    //cam.fisheyeRegion = {centerX: img.width/2, centerY: img.height/2, radius: Math.min(img.width, img.height)/2}; // auto
                    cam.fisheyeRegion = { centerX: 3200 / 2, centerY: 3000 / 2, radius: 2900 / 2 }; // ajast by hand
                    cam.defaultExponent = 10; // 2^10 if you use large texture
                    cam.resize();
                    dragging = false;
                    cam.canvas.addEventListener("mousemove", function (ev) { if (dragging) {
                        cam.drag("move", ev.offsetX, ev.offsetY);
                    } });
                    cam.canvas.addEventListener("mousedown", function (ev) { dragging = true; cam.drag("start", ev.offsetX, ev.offsetY); });
                    cam.canvas.addEventListener("mouseup", function (ev) { dragging = false; });
                    cam.canvas.addEventListener("mouseleave", function (ev) { dragging = false; });
                    //cam.canvasSize = {width: window.innerWidth, height: window.innerHeight};
                    //window.addEventListener("resize", (ev)=>{ cam.canvasSize = {width: window.innerWidth, height: window.innerHeight}; cam.render(); });
                    cam.render();
                    //cam.texctx.canvas.style.border = "1px solid black";
                    //cam.texctx.canvas.style.width = "300px";
                    document.body.appendChild(cam.canvas);
                    cam2 = new _1.Fisheye2Equirectangular();
                    window["cam2"] = cam2;
                    cam2.src = video;
                    cam2.fisheyeRegion = cam.fisheyeRegion;
                    cam2.width /= 8;
                    cam2.height /= 8;
                    cam2.render();
                    document.body.appendChild(cam2.canvas);
                    window.setInterval(function () {
                        cam.render();
                        cam2.render();
                    }, 100);
                    gui = new dat.GUI();
                    gui.add(cam, "zoom", 0.01, 2).step(0.01).onChange(function (x) { cam.render(); });
                    gui.add(cam, "centerX", -video.width, video.width).onChange(function (x) { cam.render(); cam2.centerX = x; cam2.render(); });
                    gui.add(cam, "centerY", -video.height, video.height).onChange(function (x) { cam.render(); cam2.centerY = x; cam2.render(); });
                    gui.add(cam, "radius", 1, Math.max(video.width, video.height)).onChange(function (x) { cam.render(); cam2.radius = x; cam2.render(); });
                    gui.add(cam, "pitch", 0, Math.PI / 2).onChange(function (x) { cam.render(); });
                    gui.add(cam, "yaw", -Math.PI, Math.PI).onChange(function (x) { cam.render(); });
                    gui.close();
                    return [2 /*return*/];
            }
        });
    });
}
main();
