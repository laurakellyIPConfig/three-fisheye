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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./", "qunitjs", "empower", "power-assert-formatter", "qunit-tap", "three"], factory);
    }
})(function (require, exports) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    var _1 = require("./");
    var QUnit = require("qunitjs");
    var empower = require("empower");
    var formatter = require("power-assert-formatter");
    var qunitTap = require("qunit-tap");
    QUnit.config.autostart = true;
    empower(QUnit.assert, formatter(), { destructive: true });
    qunitTap(QUnit, function () { console.log.apply(console, arguments); }, { showSourceOnFailure: false });
    QUnit.module("Fisheye");
    QUnit.test("mercator2Sphere, sphere2Mercator", function (assert) { return __awaiter(_this, void 0, void 0, function () {
        var x, y, _a, a, b, _b, _x, _y;
        return __generator(this, function (_c) {
            for (x = 0; x <= 1; x += 0.1) {
                for (y = 0; y <= 1; y += 0.1) {
                    _a = _1.mercator2Sphere(x, y), a = _a[0], b = _a[1];
                    _b = _1.sphere2Mercator(a, b), _x = _b[0], _y = _b[1];
                    assert.ok(x - 0.00000001 <= _x && _x <= x + 0.00000001);
                    assert.ok(y - 0.00000001 <= _y && _y <= y + 0.00000001);
                }
            }
            return [2 /*return*/];
        });
    }); });
    /*QUnit.test("Fisheye2Perspective", async (assert: Assert)=>{
      const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            mandatory: {
              minFrameRate: 1,
              maxFrameRate: 5,
              minWidth: 2592,
              minHeight: 1944 } } });
      const url = URL.createObjectURL(stream);
      const video = document.createElement("video");
      video.src = url;
    
      await new Promise((resolve, reject)=>{
        video.addEventListener("loadeddata", resolve, <any>{once: true});
        video.addEventListener("error", reject, <any>{once: true});
      });
    
      video.autoplay = true;
    
      const cam = new Fisheye2Perspective();
    
      cam.src = video;
      cam.canvasSize = {width: 600, height: 400};
      cam.cameraPose = {pitch: Math.PI/4, yaw: 0};
      cam.zoom = 1/3
      cam.fisheyeRegion = {centerX: 1259, centerY: 887, radius: 879};
    
      let dragging = false;
      cam.canvas.addEventListener("mousemove", (ev)=>{ if(dragging){ cam.drag("move", ev.offsetX, ev.offsetY); } });
      cam.canvas.addEventListener("mousedown", (ev)=>{ dragging = true; cam.drag("start", ev.offsetX, ev.offsetY); });
      cam.canvas.addEventListener("mouseup", (ev)=>{ dragging = false; });
      cam.canvas.addEventListener("mouseleave", (ev)=>{ dragging = false; });
    
      // dat-GUI
      const gui = new dat.GUI();
      const width = cam.texctx.canvas.width;
      gui.add(video, "currentTime", 0, video.duration);
      gui.add(cam, "zoom", 0.01, 2).step(0.01);
      gui.add(cam, "centerX", -width, width);
      gui.add(cam, "centerY", -width, width);
      gui.add(cam, "radius", 1, width/2);
      gui.add(cam, "pitch", 0, Math.PI/2);
      gui.add(cam, "yaw", -Math.PI, Math.PI);
      gui.close();
    
      document.body.appendChild(cam.canvas);
      //document.body.appendChild(cam.texctx.canvas);
      //document.body.appendChild(cam.texctx1.canvas); // sep_mode
      //document.body.appendChild(cam.texctx2.canvas); // sep_mode
      //document.body.appendChild(video);
    
      const tid = setInterval(()=>{
        cam.render();
        gui.__controllers
            .forEach((ctrl)=>{ ctrl.updateDisplay(); }); // dat-gui
      }, 30);
    
      video.play();
    
      await sleep(5 * 60 * 1000);
    
      clearTimeout(tid);
      cam.destructor();
      video.pause();
      URL.revokeObjectURL(url);
      stream.getTracks().forEach((a)=>{ a.stop(); });
    
      assert.ok(true);
    });*/
    QUnit.test("Fisheye2Equirectangular", function (assert) { return __awaiter(_this, void 0, void 0, function () {
        var video, cam;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    video = document.createElement("video");
                    video.src = "./ec2e5847-b502-484c-b898-b8e2955f4545.webm";
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            video.addEventListener("loadeddata", resolve, { once: true });
                            video.addEventListener("error", reject, { once: true });
                        })];
                case 1:
                    _a.sent();
                    cam = new _1.Fisheye2Equirectangular();
                    window["cam"] = cam;
                    cam.src = video;
                    //cam.canvasSize = {width: 600, height: 400};
                    cam.fisheyeRegion = { centerX: 1259, centerY: 887, radius: 879 };
                    document.body.appendChild(cam.canvas);
                    cam.render();
                    assert.ok(true);
                    return [2 /*return*/];
            }
        });
    }); });
    var THREE = require("three");
    QUnit.test("Equirectangular2Fisheye", function (assert) { return __awaiter(_this, void 0, void 0, function () {
        var img, skyboxtex, skybox, renderer, scene, tex, mesh, _a, width, height, camera;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    img = new Image();
                    img.src = "./WellsCathedral-28F12wyrdlight.equirectangular.png";
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            img.addEventListener("load", resolve, { once: true });
                            img.addEventListener("error", reject, { once: true });
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, _1.load_skybox_texture('../textures/cube/Park3Med/')];
                case 2:
                    skyboxtex = _b.sent();
                    return [4 /*yield*/, _1.createSkyboxMesh(skyboxtex)];
                case 3:
                    skybox = _b.sent();
                    renderer = new THREE.WebGLRenderer();
                    scene = new THREE.Scene();
                    tex = new THREE.Texture(img);
                    tex.needsUpdate = true;
                    mesh = _1.createFisheyeMesh(tex);
                    mesh.rotation.x = Math.PI; // 北緯側の半球になるように回転
                    mesh.rotation.y = Math.PI; // こっちむいてベイビー
                    mesh.position.z = -800; // カメラからの距離
                    _a = mesh.geometry.parameters, width = _a.width, height = _a.height;
                    camera = new THREE.OrthographicCamera(100 / -2, 100 / 2, 100 / 2, 100 / -2, 1, 10000);
                    //const camera = new THREE.PerspectiveCamera( 30, 4 / 3, 1, 10000 );
                    camera.position.z = 0.01;
                    scene.add(camera);
                    scene.add(mesh);
                    scene.add(skybox);
                    //renderer.setSize( 400, 300 );
                    renderer.setSize(width, height);
                    camera.left = width / -2;
                    camera.right = width / 2;
                    camera.top = height / 2;
                    camera.bottom = height / -2;
                    camera.updateProjectionMatrix();
                    document.body.appendChild(renderer.domElement);
                    tex.needsUpdate = true;
                    camera.updateProjectionMatrix();
                    renderer.render(scene, camera);
                    assert.ok(true);
                    return [2 /*return*/];
            }
        });
    }); });
    function sleep(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    }
});
