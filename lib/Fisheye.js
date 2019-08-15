(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "three", "three-orbit-controls"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var THREE = require("three");
    var _OrbitControls = require("three-orbit-controls");
    var OrbitControls = _OrbitControls(THREE);
    var Fisheye = /** @class */ (function () {
        function Fisheye(camera, o) {
            var _this = this;
            if (o != null && o.textureSizeExponent != null) {
                this.defaultExponent = o.textureSizeExponent;
            }
            else {
                this.defaultExponent = null;
            }
            if (o != null && o.debug != null) {
                this.debug = o.debug;
            }
            else {
                this.debug = false;
            }
            this.camera = camera;
            this.renderer = new THREE.WebGLRenderer();
            this.canvas = this.renderer.domElement;
            this.scene = new THREE.Scene();
            this.scene.add(this.camera);
            this.source = null;
            this.pos = [0, 0, 0, 0, 0, 0, 0, 0];
            this.exponent = 0;
            this.texctx = document.createElement("canvas").getContext("2d");
            this.region = { centerX: 300, centerY: 300, radius: 300 };
            if (this.debug) {
                this.camera.lookAt(new THREE.Vector3());
                var controls = new OrbitControls(this.camera, this.canvas);
                this.camera.position.z = 2000;
                load_skybox_texture().then(function (tex) {
                    _this.skyboxtex = tex;
                    return createSkyboxMesh(tex);
                }).then(function (skybox) {
                    _this.skybox = skybox;
                    _this.scene.add(skybox);
                });
            }
        }
        Object.defineProperty(Fisheye.prototype, "src", {
            get: function () {
                return this.source;
            },
            /**
             * @param source - Change fish eye of conversion source Change something
             */
            set: function (source) {
                if (source == null) {
                    return;
                }
                if (source === this.source) {
                    return;
                }
                this.source = source;
                this.load();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye.prototype, "centerX", {
            get: function () {
                return this.region.centerX;
            },
            set: function (centerX) {
                this.region.centerX = centerX;
                this.updateFisheyeRegion();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye.prototype, "centerY", {
            get: function () {
                return this.region.centerY;
            },
            set: function (centerY) {
                this.region.centerY = centerY;
                this.updateFisheyeRegion();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye.prototype, "radius", {
            get: function () {
                return this.region.radius;
            },
            set: function (radius) {
                this.region.radius = radius;
                this.updateFisheyeRegion();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye.prototype, "fisheyeRegion", {
            get: function () { return this.region; },
            /**
             * Adjust the position of the fish eye circle
             */
            set: function (prop) {
                this.region = prop;
                this.updateFisheyeRegion();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye.prototype, "width", {
            get: function () { return this.canvasSize.width; },
            set: function (n) { this.canvasSize = { width: n, height: this.canvasSize.height }; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye.prototype, "height", {
            get: function () { return this.canvasSize.height; },
            set: function (n) { this.canvasSize = { width: this.canvasSize.width, height: n }; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye.prototype, "canvasSize", {
            get: function () { return this.renderer.getSize(); },
            /**
             * Optimize the current renderer to the current pixel size
             */
            set: function (size) {
                // Optimize the current renderer to the current pixel size
                this.renderer.setSize(size.width, size.height);
                if (this.camera instanceof THREE.PerspectiveCamera) {
                    this.camera.aspect = size.width / size.height;
                    this.camera.updateProjectionMatrix();
                }
            },
            enumerable: true,
            configurable: true
        });
        Fisheye.prototype.destructor = function () {
            if (this.debug) {
                this.scene.remove(this.skybox);
                this.skybox.geometry.dispose();
                this.skybox.material.dispose();
                this.skyboxtex.dispose();
            }
        };
        /**
         * Fit texture to size of cam.src
         */
        Fisheye.prototype.resize = function () {
            var source = this.source;
            if (source == null) {
                return;
            }
            var width = source.width, height = source.height;
            if (source instanceof HTMLVideoElement) {
                width = source.videoWidth;
                height = source.videoHeight;
            }
            var size = Math.min(width, height);
            if (this.defaultExponent == null) {
                for (var i = 0; size > Math.pow(2, i); i++) { } // Gain 2 ^ n size      
                this.exponent = i; // Target resolution      
            }
            else {
                this.exponent = this.defaultExponent;
            }
            this.updateFisheyeRegion();
        };
        /**
         * Calculation of fisheye clipping region
         */
        Fisheye.prototype.updateFisheyeRegion = function () {
            var pow = Math.pow(2, this.exponent);
            var _a = this.region, radius = _a.radius, centerX = _a.centerX, centerY = _a.centerY;
            var clippedWidth = radius * 2;
            var clippedHeight = radius * 2;
            var left = centerX - radius;
            var top = centerY - radius;
            var _b = [left, top], sx = _b[0], sy = _b[1];
            var _c = [clippedWidth, clippedHeight], sw = _c[0], sh = _c[1];
            var _d = [0, 0], dx = _d[0], dy = _d[1];
            var _e = [pow, pow], dw = _e[0], dh = _e[1]; // Size of reduction destination
            // Negative margin supported
            if (left < 0) {
                sx = 0;
                sw = clippedWidth - left;
                dx = -left * pow / clippedWidth;
                dw = sw * pow / clippedWidth;
            }
            if (top < 0) {
                sy = 0;
                sh = clippedHeight - top;
                dy = -top * pow / clippedHeight;
                dh = sh * pow / clippedHeight;
            }
            this.pos = [sx, sy, sw, sh, dx, dy, dw, dh];
            // The size of 2 ^ n contracted extensions
            this.texctx.canvas.width = pow;
            this.texctx.canvas.height = pow;
        };
        return Fisheye;
    }());
    exports.Fisheye = Fisheye;
    function load_skybox_texture(path
    //'textures/cube/skybox/'
    //'textures/cube/SwedishRoyalCastle/'
    ) {
        if (path === void 0) { path = 'textures/cube/Park3Med/'; }
        return new Promise(function (resolve, reject) {
            var loader = new THREE.CubeTextureLoader();
            loader.setPath(path);
            loader.load([
                'px.jpg', 'nx.jpg',
                'py.jpg', 'ny.jpg',
                'pz.jpg', 'nz.jpg'
            ], resolve, function (xhr) { }, reject);
        });
    }
    exports.load_skybox_texture = load_skybox_texture;
    function createSkyboxMesh(skybox_texture) {
        var cubeShader = THREE.ShaderLib['cube'];
        cubeShader.uniforms['tCube'].value = skybox_texture;
        var skyBoxMaterial = new THREE.ShaderMaterial({
            fragmentShader: cubeShader.fragmentShader,
            vertexShader: cubeShader.vertexShader,
            uniforms: cubeShader.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });
        // BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)
        var skybox = new THREE.Mesh(new THREE.BoxGeometry(3000, 3000, 3000, 1, 1, 1), skyBoxMaterial);
        return skybox;
    }
    exports.createSkyboxMesh = createSkyboxMesh;
    /**
     * Assume a sphere with radius 1
     * @param longitude - Longitude rad
     * @param latitude - Latitude rad
     * @return [x, y]
     */
    function sphere2Mercator(longitude, latitude) {
        var x = longitude;
        var y = Math.log(Math.tan(Math.PI / 4 + latitude / 2));
        return [x, y];
    }
    exports.sphere2Mercator = sphere2Mercator;
    /**
     * Assume a sphere with radius 1
     * @param x
     * @param y
     * @return [longitude, latitude]
     */
    function mercator2Sphere(x, y) {
        var longitude = x;
        var latitude = Math.asin(Math.tanh(y));
        return [longitude, latitude];
    }
    exports.mercator2Sphere = mercator2Sphere;
    /**
     * From a square fisheye image of vertical and horizontal 2
     * Projection (up) to upper hemispherical polar coordinates with radius 1
     * @param x ∈ [-1, 1]
     * @param y ∈ [-1, 1]
     * @return [longitude, latitude] - Spherical coordinates
     */
    function fisheye2Sphere(x, y, r) {
        if (r === void 0) { r = 1; }
        var _a;
        var _b = [1, 1], cx = _b[0], cy = _b[1];
        _a = [x - cx, y - cy], x = _a[0], y = _a[1];
        var _c = [Math.atan2(y, x), Math.sqrt(x * x + y * y)], theta = _c[0], l = _c[1]; // Cartesian to Euler
        if (l >= 1) {
            return null;
        }
        var _d = [theta, Math.acos(l / r)], longitude = _d[0], latitude = _d[1];
        return [longitude, latitude];
    }
    exports.fisheye2Sphere = fisheye2Sphere;
    /**
     * From the upper hemispherical polar coordinate with radius 1
     * Projection (down) to square coordinates centered on the origin of vertical and horizontal 2
     * @param longitude - Spherical coordinates
     * @param latitude - Spherical coordinates
     * @return [x, y] ∈ [-1, 1]
     */
    function sphere2Fisheye(longitude, latitude, r) {
        if (r === void 0) { r = 1; }
        var _a = [longitude, r * Math.cos(latitude)], theta = _a[0], l = _a[1];
        var _b = [l * Math.cos(theta), l * Math.sin(theta)], x = _b[0], y = _b[1];
        return [x, y];
    }
    exports.sphere2Fisheye = sphere2Fisheye;
    /**
     * @param alpha - Right-handed coordinate system z axis Left turning around here Euler angles
     * @param beta - Right hand coordinate system x axis Around left and left Euler angles
     * @param gamma - Right hand coordinate system y axis Around left and left Euler angles
     */
    function rotate(alpha, beta, gamma) {
    }
    exports.rotate = rotate;
    /**
     * Used to convert cylindrical texture to fisheye image.
     */
    function fisheye2equirectangular(x, y) {
        var _a = [1, 1], w = _a[0], h = _a[1];
        var r = 1 / 2;
        console.assert(0 <= x && x <= 1);
        console.assert(0 <= y && y <= 1);
        x -= r;
        y -= r;
        y = y;
        var _b = [Math.atan2(y, x), Math.sqrt(x * x + y * y)], theta = _b[0], l = _b[1]; // Cartesian to Euler
        var _c = [w * (theta / (2 * Math.PI)), h * (l / r)], s = _c[0], t = _c[1];
        console.assert(-0.5 <= s && s <= 0.5);
        console.assert(0 <= t && t <= Math.sqrt(2));
        s += 0.5;
        t = (1 - t);
        return [s, t];
    }
    exports.fisheye2equirectangular = fisheye2equirectangular;
});
