import * as THREE from "three";
import {Fisheye, Radian} from "./Fisheye";


export interface CameraConfig { region: FishEyeRegion, direction: DirectionOfView, zoom: number }

export type Pixel = number;

/**
 * Position and size of the fisheye circle on the image
 */
export interface FishEyeRegion {
  centerX: Pixel;
  centerY: Pixel;
  radius: Pixel;
}

/**
 * Gaze point direction, unit
 */
export interface DirectionOfView {
  pitch: Radian;
  yaw: Radian;
}

export type Orientation = 'ceiling' | 'floor' | 'wall';

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
export class Fisheye2Perspective extends Fisheye<THREE.PerspectiveCamera> {


  /**
   * Texture clipping source fish eye
   */
  readonly texctx1: CanvasRenderingContext2D;
  readonly texctx2: CanvasRenderingContext2D;

  /**
   * Drawing mode
   * true - Texture & polygon reduction mode
   * false - naive mode
   */
  readonly sep_mode: boolean;

  // Hit judgment
  readonly collisionSphere: THREE.Mesh;

  
  /** Before load === rewrite before src change */
  private cameraOrientation: Orientation;
  public mesh_num: number;
  private meshes: THREE.Mesh[];
  private texis: THREE.Texture[];
  private readonly local: THREE.Object3D;


  private CAMERA_PITCH_MAX: number;
  private CAMERA_PITCH_MIN: number;
  private CAMERA_YAW_MAX: number;
  private CAMERA_YAW_MIN: number;

  // for debug
  readonly debug: boolean;


  private prevEuler: {pitch: Radian, yaw: Radian};

  constructor(o?: {textureSizeExponent?: number, mesh?: number, sep_mode?: boolean, orientation?: Orientation, debug?: boolean}){
    super(new THREE.PerspectiveCamera( 30, 4 / 3, 1, 10000 ), o);

    if(o != null && o.sep_mode === true){
      this.sep_mode = true;
    }else{
      this.sep_mode = false;
    }

    if(o != null && o.mesh != null){
      this.mesh_num = o.mesh;
    }else{
      this.mesh_num = 32;
    }
    
    if(o != null && o.orientation !== null && o.orientation !== undefined){
        this.orientation = o.orientation;
    } else {
        this.orientation = 'ceiling';
    }

    this.local = new THREE.Object3D();
    this.meshes = [];
    this.texis = [];

    this.local.position.z = 0;
    this.camera.position.z = 0.01;

    // Drag determination crash mesh
    // SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
    const sphereGeom =  new THREE.SphereGeometry( 100, 32, 16 );
    const blueMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff, side: THREE.BackSide, transparent: true, opacity: 0 } );
    this.collisionSphere = new THREE.Mesh( sphereGeom, blueMaterial );

    this.scene.add(this.local);
    this.scene.add(this.collisionSphere);

    
    if(this.sep_mode){
      this.texctx1 = <CanvasRenderingContext2D>document.createElement("canvas").getContext("2d");
      this.texctx2 = <CanvasRenderingContext2D>document.createElement("canvas").getContext("2d");
    }

    this.prevEuler = {pitch: 0, yaw: 0};

    if(this.debug){
      this.mesh_num = 2; // Low poly
    }
  }

  destructor(): void {
    super.destructor();
    this.unload();
    this.collisionSphere.geometry.dispose();
    this.collisionSphere.material.dispose();
  }

  /**
   * draw
   * needsUpdate to render
   */
  render(): void {
    if(this.src == null){ return; }
    const [sx, sy, sw, sh, dx, dy, dw, dh] = this.pos;
    this.texctx.canvas.width = this.texctx.canvas.width; // clear
    const {width, height} = this.texctx.canvas;

    if(this.sep_mode) {
      // Rotate texture
      this.texctx.translate(width/2, height/2);
      this.texctx.rotate(this.yaw);
      this.texctx.translate(-width/2, -height/2);
      this.texctx.transform(-1, 0, 0, 1, width, 0);

      // clear
      this.texctx1.canvas.width = width/2;
      this.texctx2.canvas.width = width/2;
      const {width: w1, height: h1} = this.texctx1.canvas;
      const {width: w2, height: h2} = this.texctx2.canvas;

      // Texctx 1 should be at the center of the lower left fisheye
      this.texctx1.translate(w1/2, h1/2);
      this.texctx1.rotate(Math.PI/2);
      this.texctx1.translate(-w1/2, -h1/2);
      
      // As for the texctx 2, since the lower left is the center of the fisheye, it is acceptable as it is
      this.texctx.drawImage(this.src, sx, sy, sw, sh, dx, dy, dw, dh);
      this.texctx1.drawImage(this.texctx.canvas, 0,       0, width/2, height/2, 0, 0, w1, h1);
      this.texctx2.drawImage(this.texctx.canvas, width/2, 0, width/2, height/2, 0, 0, w2, h2);
    } else {
      // Only render if we have image data
      if (this.src instanceof HTMLImageElement && !this.src.complete) { return; }
      this.texctx.drawImage(this.src, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    this.texis.forEach((tex)=>{ tex.needsUpdate = true; });
    this.renderer.render(this.scene, this.camera);
  }

  set orientation(orientation: Orientation) {
    if(this.cameraOrientation === orientation) {
        return;
    }

    this.cameraOrientation = orientation;
    switch(this.cameraOrientation) {
        case 'floor':
            this.CAMERA_PITCH_MIN = 0;
            this.CAMERA_PITCH_MAX = Math.PI/2;
            this.CAMERA_YAW_MIN = 0;
            this.CAMERA_YAW_MAX = 2*Math.PI;

            this.pitch = Math.PI / 4;
            this.yaw = 0;
            this.zoom = 0.5; 
            break;
        case 'ceiling':
            this.CAMERA_PITCH_MIN = 0;
            this.CAMERA_PITCH_MAX = Math.PI/2;
            this.CAMERA_YAW_MIN = 0;
            this.CAMERA_YAW_MAX = 2*Math.PI;

            this.pitch = Math.PI / 4;
            this.yaw = 0;
            this.zoom = 0.5; 
            break;
        case 'wall':
            this.CAMERA_PITCH_MIN = -1 * Math.PI/2;
            this.CAMERA_PITCH_MAX = Math.PI/2;
            this.CAMERA_YAW_MIN = -1 * Math.PI/2;
            this.CAMERA_YAW_MAX = Math.PI/2;

            this.pitch = 0;
            this.yaw = 0;
            this.zoom = 0.5; 
            break;
    }

    if(this.meshes !== undefined && this.meshes.length > 0) {
        if (this.orientation === 'wall') {
            this.meshes[0].rotation.z = 0; 
        } else {
            this.meshes[0].rotation.y = 0;
        }
    }
  }

  public getViewLimits(): Object {
      return {
          pitch: {
              min: this.CAMERA_PITCH_MIN,
              max: this.CAMERA_PITCH_MAX
          },
          yaw: {
              min: this.CAMERA_YAW_MIN,
              max: this.CAMERA_YAW_MAX
          }
      };
  }

  public getViewLimitsDegrees(): Object {
      return {
          pitch: {
              min: toDeg(this.CAMERA_PITCH_MIN),
              max: toDeg(this.CAMERA_PITCH_MAX)
          },
          yaw: {
              min: toDeg(this.CAMERA_YAW_MIN),
              max: toDeg(this.CAMERA_YAW_MAX)
          }
      };
  }

  get orientation(): Orientation {
    return this.cameraOrientation;
  }

  set pitchDegrees(pitch: number) {
    this.pitch = toRad(pitch);
  }

  get pitchDegrees(): number {
      return toDeg(this.pitch);
  }

  set pitch(pitch: Radian) {
      if (this.local !== undefined) {
          if(this.orientation === 'ceiling') {
              this.local.rotation.x = Math.PI + pitch;
          } else if(this.orientation === 'wall') {
              this.local.rotation.x = -1*Math.PI/2 - pitch;
          } else {
              this.local.rotation.x = -1*pitch;
          }
      }
  }
  get pitch(): Radian {
      if (this.local === undefined) { return 0 });
      if(this.orientation === 'ceiling') {
        return (this.local.rotation.x - Math.PI);
      } else if(this.orientation === 'wall') {
          return (-1*Math.PI/2 - this.local.rotation.x);
      } else {
          return -1*this.local.rotation.x;
      }
  }
  private _yaw: Radian;

  set yawDegrees(yaw: number) {
    this.yaw = toRad(yaw);
  }

  get yawDegrees(): number {
      return toDeg(this.yaw);
  }

  set yaw(yaw: Radian){
    if(this.meshes === undefined || this.meshes.length === 0){ return; }
    if(this.sep_mode){
      this._yaw = yaw;
    }else{
      if (this.orientation === 'wall') {
        this.meshes[0].rotation.y = -1 * yaw;
      } else {
        this.meshes[0].rotation.z = yaw;
      }
    }
  }
  get yaw(): Radian {
    if(this.meshes === undefined || this.meshes.length === 0){ return 0; }
    if(this.sep_mode){
      return this._yaw;
    }else{
      if (this.orientation === 'wall') {
        return -1 * this.meshes[0].rotation.y;
      } else {
        return this.meshes[0].rotation.z;
      }
    }
  }

  set cameraPose({pitch, yaw}: DirectionOfView) {
    const {camera, local} = this;
    this.pitch = pitch;
    this.yaw = yaw;
  }
  get cameraPose(): DirectionOfView {
    const {camera, local} = this;
    const pitch = this.pitch;
    const yaw = this.yaw;
    return {pitch, yaw};
  }

  set cameraPoseDegrees({pitch, yaw}: DirectionOfView) {
    const {camera, local} = this;
    this.pitchDegrees = pitch;
    this.yawDegrees = yaw;
  }
  get cameraPoseDegrees(): DirectionOfView {
    const {camera, local} = this;
    const pitch = this.pitchDegrees;
    const yaw = this.yawDegrees;
    return {pitch, yaw};
  }

  set zoom(scale: number) {
        this.camera.zoom = scale;
        this.camera.updateProjectionMatrix();
  }
  get zoom(): number {
        return this.camera.zoom;
  }

  public setSphereScale(x: number, y: number, z: number): void {
    this.meshes.forEach((mesh)=>{
        mesh.scale.set(x, y, z);
    });
  }

  /**
   * Screen information
   */
  get config(): CameraConfig {
    const {region, zoom, cameraPose: direction} = this;
    return {region, direction, zoom};
  }
  set config(conf: CameraConfig) {
    const {region, zoom, direction: cameraPose} = conf;
    this.region = region;
    this.zoom = zoom;
    this.cameraPose = cameraPose;
  }

  protected updateFisheyeRegion() {
    super.updateFisheyeRegion();
    if(this.sep_mode){
      const {width, height} = this.texctx.canvas;
      this.texctx1.canvas.width = width/2;
      this.texctx2.canvas.width = width/2;
      this.texctx1.canvas.height = height/2;
      this.texctx2.canvas.height = height/2;
    }
  }
  /**
   * Erase previous resources
   */
  protected unload(): void {
    this.meshes.forEach((mesh)=>{
      this.local.remove( mesh );
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.texis.forEach((tex)=>{
      tex.dispose();
    });
    this.meshes = [];
    this.texis = [];
  }

  /**
   * Resource replacement
   */
  protected load(): void {
    const source = this.src;

    if(source == null){ return; }
    // Get current setting
    const config = this.config;

    this.unload(); // Erase previous panoramas

    this.resize();
    
    // Celestial mesh
    if(this.sep_mode){
      const tex1 = new THREE.Texture(this.texctx1.canvas);
      const tex2 = new THREE.Texture(this.texctx2.canvas);
      const mesh1 = createFisheyeMesh2(tex1, this.mesh_num);
      mesh1.rotation.z = Math.PI/2; // To be on the left side      
      const mesh2 = createFisheyeMesh2(tex2, this.mesh_num);

      this.local.add(mesh1);
      this.local.add(mesh2);
      this.meshes.push(mesh1);
      this.meshes.push(mesh2);
      this.texis.push(tex1);
      this.texis.push(tex2);
    }else{
      const tex = new THREE.Texture(this.texctx.canvas);
      const mesh = createFisheyeMesh(tex, this.mesh_num);

      this.local.add(mesh);
      this.meshes.push(mesh);
      this.texis.push(tex);
    }
    // Reflect previous setting
    this.config = config;
  }

  drag(type: "start" | "move", offsetX: number, offsetY: number){

    if(this.debug){
      console.info("Fisheye2Perspective now debug mode so use OrbitControls");
      return;
    }
    const {width, height} = this.canvasSize;
    // Normalize the acquired screen coordinates to -1 to 1 (the coordinates are represented by WebGL from -1 to 1)
    var mouseX =  (offsetX/width)  * 2 - 1;
    var mouseY = -(offsetY/height) * 2 + 1;

    if(this.orientation === 'ceiling') {
        mouseX *= -1;
        mouseY *= -1;
    }

    const pos = new THREE.Vector3(mouseX, mouseY, 1);
    const {camera, collisionSphere} = this;
    // Since pos is a screen coordinate system, convert it to the coordinate system of the object
    // Since the object coordinate system is a viewpoint from the camera that is currently displayed, a camera object is passed as the second argument
    // new THREE.Projector.unprojectVector(pos, camera); ↓ In the latest version you get it in the following way
    pos.unproject(camera);
    // Pass the start point and orientation vector and create ray
    const ray = new THREE.Raycaster(camera.position, pos.sub(camera.position).normalize());
    const objs = ray.intersectObjects([collisionSphere]);
    // https://threejs.org/docs/api/core/Raycaster.html
    if(objs.length === 0){ return; }
    const obj = objs[0];
    if(type === "start"){
      this.prevEuler = toEuler(obj.point, obj.distance);
      return;
    }
    const curr = toEuler(obj.point, obj.distance);
    const {pitch, yaw} = this;
    let   _pitch = pitch - (curr.pitch - this.prevEuler.pitch);
    let _yaw   = yaw   - (curr.yaw - this.prevEuler.yaw);
    if(_pitch > this.CAMERA_PITCH_MAX){ _pitch = this.CAMERA_PITCH_MAX; }
    if(_pitch < this.CAMERA_PITCH_MIN){ _pitch = this.CAMERA_PITCH_MIN; }

    if (this.orientation === 'wall') {
        if(_yaw > this.CAMERA_YAW_MAX){ _yaw = this.CAMERA_YAW_MAX; }
        if(_yaw < this.CAMERA_YAW_MIN){ _yaw = this.CAMERA_YAW_MIN; }
    }

    this.pitch = _pitch;
    this.yaw = _yaw;
    this.render();
    
    this.prevEuler = curr;
  }
}

/**
 * ptr is the screen
 * Head towards back - z axis,
 * The x axis toward the right
 * Upward y-axis
 * Right-handed system like */
function toEuler(ptr: THREE.Vector3, l: number): {pitch: Radian, yaw: Radian}{
  // screen
  // The x axis towards the back
  // Right y axis
  // Up z axis
  // Convert to coordinate system
  const [x,y,z] = [-ptr.z, ptr.x, ptr.y]; 
  // Convert to Euler angle
  const yaw   = - Math.atan2(y, x);
  const a = -z/l;
  const pitch = Math.atan2(z, Math.sqrt(x*x + y*y));
  //2*Math.atan2(a, 1 + Math.sqrt(1 - Math.pow(a, 2))); // == asin(-z/l)
  return {yaw, pitch};
}

function toDeg(radians: number) {
  return radians * 180 / Math.PI;
}

function toRad(degrees: number) {
    return degrees * Math.PI / 180;
}

/**
 * Get a material projecting a square texture onto a hemisphere and its mesh
 * @param fisheye_texture - Square Texture
 */
function createFisheyeMesh(fisheye_texture: THREE.Texture, MESH_N: number): THREE.Mesh { // Assume a square texture
  // SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
  const sphere = new THREE.SphereGeometry(1000, MESH_N, MESH_N, Math.PI, Math.PI);
  const {vertices, faces, faceVertexUvs} = sphere;
  const radius = sphere.boundingSphere.radius;
  // Take the orthographic projection of the hemisphere
  faces.forEach((face, i)=>{
    // face: one polygon
    const {a, b, c} = face; // ID of three vertices of polygon
    // It is faceVertexUvs [0], but 1 is not particularly - http://d.hatena.ne.jp/technohippy/20120718
    faceVertexUvs[0][i] = [a, b, c].map((id)=>{
      var {x, y, z} = vertices[id], // Three-dimensional vertex coordinates of polygons
        a, b,
        r,      // radius of vector defined by x,y,z going through the origin piont in the lens
        theta,  // angle of incidcence through the lens
        x1, y1, // x, y adjusted for angle of theta
        u, v;   // U, V coordinates for pixel mapping in range [0, 1]

      if (z > -0.00000000001) {
        z = -0.00000000001;
      }

      a = x/z;
      b = y/z;
  
      r = Math.sqrt(a*a + b*b); 
      theta = Math.atan(r);
    
      x1 = 2 * (theta/r) * a / Math.PI;
      y1 = 2* (theta/r) * b / Math.PI;

      u = (x1 + 1) / (2);
      v = (y1 + 1) / (2);

    return new THREE.Vector2(
        u,
        v
    );

    });
  });
  const mat = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, map: fisheye_texture, side: THREE.BackSide } );
  const mesh = new THREE.Mesh(sphere, mat);
  mesh.rotation.x = Math.PI*1/2; // Rotate to be a hemisphere on the north latitude side
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
function createFisheyeMesh2(tex: THREE.Texture, MESH_N: number): THREE.Mesh {
  const sphere = new THREE.SphereGeometry(1000, MESH_N, MESH_N, Math.PI/2, Math.PI/2, 0, Math.PI/2);
  const {vertices, faces, faceVertexUvs} = sphere;
  const radius = sphere.boundingSphere.radius;
  // Take the orthographic projection of the hemisphere
  faces.forEach((face, i)=>{
    // face: One polygon
    const {a, b, c} = face; // ID of three vertices of polygon    
    // It is faceVertexUvs [0], but 1 is not particularly - http://d.hatena.ne.jp/technohippy/20120718
    faceVertexUvs[0][i] = [a, b, c].map((id)=>{
      const {x, y, z} = vertices[id]; // Three-dimensional vertex coordinates of polygons      
      return new THREE.Vector2(
        x/radius,
        y/radius);
    });
  });
  const mat = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, map: tex, side: THREE.DoubleSide } );
  const mesh = new THREE.Mesh(sphere, mat);
  mesh.rotation.x = -Math.PI/2; // Rotate to be a hemisphere on the north latitude side
  return mesh;
}

