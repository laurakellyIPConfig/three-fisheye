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
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "three", "./Fisheye"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var THREE = require("three");
    var Fisheye_1 = require("./Fisheye");
    /**
     * Convert fish eye cnv to perspective projection
     * A reusable gl renderer that can dynamically change the source cnv
     * @example
     * ```js
     * // life cycle
     * const a = new FisheyeCanvas2PerspectiveRenderer();
     * a.changeSource(video);         // Fisheye source specification
     * a.updateFisheyeRegion(region); // Specify the region to be clipped from the fisheye source
     * a.setCanvasSize(size);         // Specify output canvas size
     * a.setCameraPose(pose);         // Specify camera orientation
     * a.render();                    // drawing
     * document.body.append(a.canvas); // Result display
    
     * ```
     */
    var Fisheye2Perspective = /** @class */ (function (_super) {
        __extends(Fisheye2Perspective, _super);
        function Fisheye2Perspective(o) {
            var _this = _super.call(this, new THREE.PerspectiveCamera(30, 4 / 3, 1, 10000), o) || this;
            if (o != null && o.sep_mode === true) {
                _this.sep_mode = true;
            }
            else {
                _this.sep_mode = false;
            }
            if (o != null && o.mesh != null) {
                _this.mesh_num = o.mesh;
            }
            else {
                _this.mesh_num = 32;
            }
            _this.local = new THREE.Object3D();
            _this.meshes = [];
            _this.texis = [];
            _this.local.position.z = 0;
            _this.camera.position.z = 0.01;
            // Drag determination crash mesh
            // SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
            var sphereGeom = new THREE.SphereGeometry(100, 32, 16);
            var blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.BackSide, transparent: true, opacity: 0 });
            _this.collisionSphere = new THREE.Mesh(sphereGeom, blueMaterial);
            _this.scene.add(_this.local);
            _this.scene.add(_this.collisionSphere);
            if (_this.sep_mode) {
                _this.texctx1 = document.createElement("canvas").getContext("2d");
                _this.texctx2 = document.createElement("canvas").getContext("2d");
            }
            _this.CAMERA_PITCH_MAX = Math.PI * 1 / 8;
            _this.CAMERA_PITCH_MIN = (Math.PI / 2) * 7 / 8;
            _this.prevEuler = { pitch: 0, yaw: 0 };
            if (_this.debug) {
                _this.mesh_num = 2; // Low poly
            }
            return _this;
        }
        Fisheye2Perspective.prototype.destructor = function () {
            _super.prototype.destructor.call(this);
            this.unload();
            this.collisionSphere.geometry.dispose();
            this.collisionSphere.material.dispose();
        };
        /**
         * draw
         * needsUpdate to render
         */
        Fisheye2Perspective.prototype.render = function () {
            if (this.src == null) {
                return;
            }
            var _a = this.pos, sx = _a[0], sy = _a[1], sw = _a[2], sh = _a[3], dx = _a[4], dy = _a[5], dw = _a[6], dh = _a[7];
            this.texctx.canvas.width = this.texctx.canvas.width; // clear
            var _b = this.texctx.canvas, width = _b.width, height = _b.height;
            if (this.sep_mode) {
                // Rotate texture
                this.texctx.translate(width / 2, height / 2);
                this.texctx.rotate(this.yaw);
                this.texctx.translate(-width / 2, -height / 2);
                this.texctx.transform(-1, 0, 0, 1, width, 0);
                // clear
                this.texctx1.canvas.width = width / 2;
                this.texctx2.canvas.width = width / 2;
                var _c = this.texctx1.canvas, w1 = _c.width, h1 = _c.height;
                var _d = this.texctx2.canvas, w2 = _d.width, h2 = _d.height;
                // Texctx 1 should be at the center of the lower left fisheye
                this.texctx1.translate(w1 / 2, h1 / 2);
                this.texctx1.rotate(Math.PI / 2);
                this.texctx1.translate(-w1 / 2, -h1 / 2);
                // As for the texctx 2, since the lower left is the center of the fisheye, it is acceptable as it is
                this.texctx.drawImage(this.src, sx, sy, sw, sh, dx, dy, dw, dh);
                this.texctx1.drawImage(this.texctx.canvas, 0, 0, width / 2, height / 2, 0, 0, w1, h1);
                this.texctx2.drawImage(this.texctx.canvas, width / 2, 0, width / 2, height / 2, 0, 0, w2, h2);
            }
            else {
                this.texctx.drawImage(this.src, sx, sy, sw, sh, dx, dy, dw, dh);
            }
            this.texis.forEach(function (tex) { tex.needsUpdate = true; });
            this.renderer.render(this.scene, this.camera);
        };
        Object.defineProperty(Fisheye2Perspective.prototype, "pitch", {
            get: function () {
                return -this.local.rotation.x;
            },
            set: function (pitch) {
                this.local.rotation.x = -pitch;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye2Perspective.prototype, "yaw", {
            get: function () {
                if (this.meshes.length === 0) {
                    return 0;
                }
                if (this.sep_mode) {
                    return this._yaw;
                }
                else {
                    return this.meshes[0].rotation.z;
                }
            },
            set: function (yaw) {
                if (this.meshes.length === 0) {
                    return;
                }
                if (this.sep_mode) {
                    this._yaw = yaw;
                }
                else {
                    this.meshes[0].rotation.z = yaw;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye2Perspective.prototype, "cameraPose", {
            get: function () {
                var _a = this, camera = _a.camera, local = _a.local;
                var pitch = this.pitch;
                var yaw = this.yaw;
                return { pitch: pitch, yaw: yaw };
            },
            set: function (_a) {
                var pitch = _a.pitch, yaw = _a.yaw;
                var _b = this, camera = _b.camera, local = _b.local;
                this.pitch = pitch;
                this.yaw = yaw;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Fisheye2Perspective.prototype, "zoom", {
            get: function () {
                return this.camera.zoom;
            },
            set: function (scale) {
                this.camera.zoom = scale;
                this.camera.updateProjectionMatrix();
            },
            enumerable: true,
            configurable: true
        });
        Fisheye2Perspective.prototype.setSphereScale = function (x, y, z) {
            this.meshes.forEach(function (mesh) {
                mesh.scale.set(x, y, z);
            });
        };
        Object.defineProperty(Fisheye2Perspective.prototype, "config", {
            /**
             * Screen information
             */
            get: function () {
                var _a = this, region = _a.region, zoom = _a.zoom, direction = _a.cameraPose;
                return { region: region, direction: direction, zoom: zoom };
            },
            set: function (conf) {
                var region = conf.region, zoom = conf.zoom, cameraPose = conf.direction;
                this.region = region;
                this.zoom = zoom;
                this.cameraPose = cameraPose;
            },
            enumerable: true,
            configurable: true
        });
        Fisheye2Perspective.prototype.updateFisheyeRegion = function () {
            _super.prototype.updateFisheyeRegion.call(this);
            if (this.sep_mode) {
                var _a = this.texctx.canvas, width = _a.width, height = _a.height;
                this.texctx1.canvas.width = width / 2;
                this.texctx2.canvas.width = width / 2;
                this.texctx1.canvas.height = height / 2;
                this.texctx2.canvas.height = height / 2;
            }
        };
        /**
         * Erase previous resources
         */
        Fisheye2Perspective.prototype.unload = function () {
            var _this = this;
            this.meshes.forEach(function (mesh) {
                _this.local.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            });
            this.texis.forEach(function (tex) {
                tex.dispose();
            });
            this.meshes = [];
            this.texis = [];
        };
        /**
         * Resource replacement
         */
        Fisheye2Perspective.prototype.load = function () {
            var source = this.src;
            if (source == null) {
                return;
            }
            // Get current setting
            var config = this.config;
            this.unload(); // Erase previous panoramas
            this.resize();
            // Celestial mesh
            if (this.sep_mode) {
                var tex1 = new THREE.Texture(this.texctx1.canvas);
                var tex2 = new THREE.Texture(this.texctx2.canvas);
                var mesh1 = createFisheyeMesh2(tex1, this.mesh_num);
                mesh1.rotation.z = Math.PI / 2; // To be on the left side      
                var mesh2 = createFisheyeMesh2(tex2, this.mesh_num);
                this.local.add(mesh1);
                this.local.add(mesh2);
                this.meshes.push(mesh1);
                this.meshes.push(mesh2);
                this.texis.push(tex1);
                this.texis.push(tex2);
            }
            else {
                var tex = new THREE.Texture(this.texctx.canvas);
                var mesh = createFisheyeMesh(tex, this.mesh_num);
                this.local.add(mesh);
                this.meshes.push(mesh);
                this.texis.push(tex);
            }
            // Reflect previous setting
            this.config = config;
        };
        Fisheye2Perspective.prototype.drag = function (type, offsetX, offsetY) {
            if (this.debug) {
                console.info("Fisheye2Perspective now debug mode so use OrbitControls");
                return;
            }
            var _a = this.canvasSize, width = _a.width, height = _a.height;
            // Normalize the acquired screen coordinates to -1 to 1 (the coordinates are represented by WebGL from -1 to 1)
            var mouseX = (offsetX / width) * 2 - 1;
            var mouseY = -(offsetY / height) * 2 + 1;
            var pos = new THREE.Vector3(mouseX, mouseY, 1);
            var _b = this, camera = _b.camera, collisionSphere = _b.collisionSphere;
            // Since pos is a screen coordinate system, convert it to the coordinate system of the object
            // Since the object coordinate system is a viewpoint from the camera that is currently displayed, a camera object is passed as the second argument
            // new THREE.Projector.unprojectVector(pos, camera); ↓ In the latest version you get it in the following way
            pos.unproject(camera);
            // Pass the start point and orientation vector and create ray
            var ray = new THREE.Raycaster(camera.position, pos.sub(camera.position).normalize());
            var objs = ray.intersectObjects([collisionSphere]);
            // https://threejs.org/docs/api/core/Raycaster.html
            if (objs.length === 0) {
                return;
            }
            var obj = objs[0];
            if (type === "start") {
                this.prevEuler = toEuler(obj.point, obj.distance);
                return;
            }
            var curr = toEuler(obj.point, obj.distance);
            var _c = this, pitch = _c.pitch, yaw = _c.yaw;
            var _pitch = pitch - (curr.pitch - this.prevEuler.pitch);
            var _yaw = yaw - (curr.yaw - this.prevEuler.yaw);
            if (_pitch < this.CAMERA_PITCH_MAX) {
                _pitch = this.CAMERA_PITCH_MAX;
            }
            if (_pitch > this.CAMERA_PITCH_MIN) {
                _pitch = this.CAMERA_PITCH_MIN;
            }
            this.pitch = _pitch;
            this.yaw = _yaw;
            this.render();
            this.prevEuler = curr;
        };
        return Fisheye2Perspective;
    }(Fisheye_1.Fisheye));
    exports.Fisheye2Perspective = Fisheye2Perspective;
    /**
     * ptr is the screen
     * Head towards back - z axis,
     * The x axis toward the right
     * Upward y-axis
     * Right-handed system like */
    function toEuler(ptr, l) {
        // screen
        // The x axis towards the back
        // Right y axis
        // Up z axis
        // Convert to coordinate system
        var _a = [-ptr.z, ptr.x, ptr.y], x = _a[0], y = _a[1], z = _a[2];
        // Convert to Euler angle
        var yaw = -Math.atan2(y, x);
        var a = -z / l;
        var pitch = Math.atan2(z, Math.sqrt(x * x + y * y));
        //2*Math.atan2(a, 1 + Math.sqrt(1 - Math.pow(a, 2))); // == asin(-z/l)
        return { yaw: yaw, pitch: pitch };
    }
    function toDeg(radians) {
        return radians * 180 / Math.PI;
    }
    /**
     * Get a material projecting a square texture onto a hemisphere and its mesh
     * @param fisheye_texture - Square Texture
     */
    function createFisheyeMesh(fisheye_texture, MESH_N) {
        // SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
        var sphere = new THREE.SphereGeometry(1000, MESH_N, MESH_N, Math.PI, Math.PI);
        var vertices = sphere.vertices, faces = sphere.faces, faceVertexUvs = sphere.faceVertexUvs;
        var radius = sphere.boundingSphere.radius;
        // Take the orthographic projection of the hemisphere
        faces.forEach(function (face, i) {
            // face: one polygon
            var a = face.a, b = face.b, c = face.c; // ID of three vertices of polygon
            // It is faceVertexUvs [0], but 1 is not particularly - http://d.hatena.ne.jp/technohippy/20120718
            faceVertexUvs[0][i] = [a, b, c].map(function (id) {
                var _a = vertices[id], x = _a.x, y = _a.y, z = _a.z; // Three-dimensional vertex coordinates of polygons
                return new THREE.Vector2((x + radius) / (2 * radius), (y + radius) / (2 * radius));
            });
        });
        var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, map: fisheye_texture, side: THREE.BackSide });
        var mesh = new THREE.Mesh(sphere, mat);
        mesh.rotation.x = Math.PI * 1 / 2; // Rotate to be a hemisphere on the north latitude side
        return mesh;
    }
    /**
     * A range of 0 to 90 degrees north latitude and 0 to 90 degree west longitude
     * front
     *    ^ y top
     *   /
     *  /
     * +-------> right
     * |       x
     * |
     * v z
     * back
     *
     * Return half-hemisphere surrounded by 3, back, -right, top
     *
     * The texture is stuck on the xy plane. The fisheye canvas is affixed to the xy plane as shown in the figure so that the center of the fish eye is at the bottom left.
     *
     * ^_ y
     * |   `
     * |     \
     * +------> x
     *  \
     *   \
     *    v z
     *
     * In this state, since the center of the fisheye is in the z direction, `mesh.rotation.x = Math.PI / 2;` brings the center of the fisheye in the y direction.
     *
     * The final mesh is displayed as half-hemisphere of front-right-top with rotation = 0.
     */
    function createFisheyeMesh2(tex, MESH_N) {
        var sphere = new THREE.SphereGeometry(1000, MESH_N, MESH_N, Math.PI / 2, Math.PI / 2, 0, Math.PI / 2);
        var vertices = sphere.vertices, faces = sphere.faces, faceVertexUvs = sphere.faceVertexUvs;
        var radius = sphere.boundingSphere.radius;
        // Take the orthographic projection of the hemisphere
        faces.forEach(function (face, i) {
            // face: One polygon
            var a = face.a, b = face.b, c = face.c; // ID of three vertices of polygon    
            // It is faceVertexUvs [0], but 1 is not particularly - http://d.hatena.ne.jp/technohippy/20120718
            faceVertexUvs[0][i] = [a, b, c].map(function (id) {
                var _a = vertices[id], x = _a.x, y = _a.y, z = _a.z; // Three-dimensional vertex coordinates of polygons      
                return new THREE.Vector2(x / radius, y / radius);
            });
        });
        var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, map: tex, side: THREE.DoubleSide });
        var mesh = new THREE.Mesh(sphere, mat);
        mesh.rotation.x = -Math.PI / 2; // Rotate to be a hemisphere on the north latitude side  
        return mesh;
    }
});
