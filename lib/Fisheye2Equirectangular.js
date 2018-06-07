"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = require("three");
var Fisheye_1 = require("./Fisheye");
/**
 * Equirectangular Cylindrical Mercator
* http://wiki.panotools.org/Projections
*/
var Fisheye2Equirectangular = /** @class */ (function (_super) {
    __extends(Fisheye2Equirectangular, _super);
    function Fisheye2Equirectangular(o) {
        var _this = this;
        // left, right, top, bottom, near, far
        var camera = new THREE.OrthographicCamera(600 / -2, 600 / 2, 400 / 2, 400 / -2, 1, 10000);
        camera.position.z = 0.01;
        _this = _super.call(this, camera, o) || this;
        _this.meshes = [];
        _this.texis = [];
        return _this;
    }
    Fisheye2Equirectangular.prototype.render = function () {
        if (this.src == null) {
            return;
        }
        var _a = this.pos, sx = _a[0], sy = _a[1], sw = _a[2], sh = _a[3], dx = _a[4], dy = _a[5], dw = _a[6], dh = _a[7];
        this.texctx.canvas.width = this.texctx.canvas.width; // clear
        var _b = this.texctx.canvas, width = _b.width, height = _b.height;
        this.texctx.drawImage(this.src, sx, sy, sw, sh, dx, dy, dw, dh);
        this.texis.forEach(function (tex) { tex.needsUpdate = true; });
        this.renderer.render(this.scene, this.camera);
    };
    Fisheye2Equirectangular.prototype.load = function () {
        var source = this.src;
        if (source == null) {
            return;
        }
        this.unload(); // Erase previous panoramas
        // Optimize the current renderer to the current pixel size
        this.resize();
        var tex = new THREE.Texture(this.texctx.canvas);
        var mesh = createPanoramaMesh(tex);
        var _a = mesh.geometry.parameters, width = _a.width, height = _a.height;
        this.renderer.setSize(width, height);
        this.camera.left = width / -2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = height / -2;
        this.camera.updateProjectionMatrix();
        this.scene.add(mesh);
        this.meshes.push(mesh);
        this.texis.push(tex);
    };
    Fisheye2Equirectangular.prototype.unload = function () {
        var _this = this;
        this.meshes.forEach(function (mesh) {
            _this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.texis.forEach(function (tex) {
            tex.dispose();
        });
        this.meshes = [];
        this.texis = [];
    };
    Fisheye2Equirectangular.prototype.drag = function (type, offsetX, offsetY) {
    };
    return Fisheye2Equirectangular;
}(Fisheye_1.Fisheye));
exports.Fisheye2Equirectangular = Fisheye2Equirectangular;
function createPanoramaMesh(fisheye_texture, panorama_width, R1_ratio, R2_ratio) {
    if (panorama_width === void 0) { panorama_width = 0; }
    if (R1_ratio === void 0) { R1_ratio = 0; }
    if (R2_ratio === void 0) { R2_ratio = 1; }
    // Assume a square texture
    //const panorama_width = 400; Panorama board Polar width in space, default is R2 circumference length
    //const R1_ratio = 0; // Fan-shaped lower quarter 0 - 1
    //const R2_ratio = 1; // Fan shaped upper quarter 0 - 1 lower string <upper string
    var _a = (function () {
        // fisheye -> panorama
        // Calculate w / h aspect ratio of panorama of
        var _a = fisheye_texture.image, width = _a.width, height = _a.height;
        var _b = [width, height], Hs = _b[0], Ws = _b[1]; // fisheye Image Short Diameter    
        var _c = [Ws / 2, Hs / 2], Cx = _c[0], Cy = _c[1]; // fisheye Central coordinates
        var R = Hs / 2; // Radius from center coordinates
        var _d = [R * R1_ratio, R * R2_ratio], R1 = _d[0], R2 = _d[1]; // fisheye Two radii determining the area to cut out in a donut shape from
        var _e = [(R2 + R1) * Math.PI, R2 - R1], Wd = _e[0], Hd = _e[1]; // The size obtained by converting the donut-shaped region into a short diameter
        return { height: Hd, width: Wd };
    })(), width = _a.width, height = _a.height;
    var h_per_w_ratio = height / width;
    // Set default value of panorama_width
    if (panorama_width <= 0) {
        panorama_width = width;
    }
    var plane = new THREE.PlaneGeometry(panorama_width, panorama_width * h_per_w_ratio, 32, 32);
    var vertices = plane.vertices, faces = plane.faces, faceVertexUvs = plane.faceVertexUvs;
    // Convert UV to fan type
    var _b = [1, 1], Hs = _b[0], Ws = _b[1]; // Size of UV
    var _c = [Ws / 2, Hs / 2], Cx = _c[0], Cy = _c[1]; // Center coordinates of UV  
    var R = Hs / 2; // Radius from center coordinates  
    var _d = [R * R1_ratio, R * R2_ratio], R1 = _d[0], R2 = _d[1]; // Radius determining the region to cut out from the UV in a donut shape
    var _e = [1, 1], Wd = _e[0], Hd = _e[1]; // The size obtained by converting the donut-shaped region into a short diameter
    faceVertexUvs[0] = faceVertexUvs[0].map(function (pt2Dx3) {
        return pt2Dx3.map(function (_a) {
            var x = _a.x, y = _a.y;
            var _b = [x, y], xD = _b[0], yD = _b[1];
            // x, y ∈ [0, 1] is the UV coordinate on the PlaneGeometry normalized to a square
            // For example, (x, y) = (0, 0) is the PlaneGeometry upper left coordinate.
            // This (x, y) coordinates should return the (fisheye) texture coordinates that should be displayed.
            // Since the texture is a fisheye image this time, the texture coordinates to be displayed by the UV coordinates (0,0) are (0, 0) in Euler coordinates and (cx, cy) in orthogonal coordinates.
            // Consider which position on the texture should be displayed (mapped) for a certain pixel on Plane Geometry.
            var r = (yD / Hd) * (R2 - R1) + R1;
            var theta = (xD / Wd) * 2.0 * Math.PI;
            var xS = Cx + r * Math.sin(theta);
            var yS = Cy + r * Math.cos(theta);
            return new THREE.Vector2(xS, yS);
        });
    });
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, map: fisheye_texture });
    var mesh = new THREE.Mesh(plane, mat);
    mesh.rotation.x = Math.PI; // Rotate to be a hemisphere on the north latitude side
    mesh.rotation.y = Math.PI; // Peeled baby here  
    mesh.position.z = -panorama_width; // Distance from camera
    return mesh;
}
exports.createPanoramaMesh = createPanoramaMesh;
