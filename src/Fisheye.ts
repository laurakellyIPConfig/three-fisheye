import * as THREE from "three";
import _OrbitControls = require('three-orbit-controls')
const OrbitControls = _OrbitControls(THREE);

export abstract class Fisheye<Camera extends THREE.Camera>{
  /**
    * gl canvas
    */
  public readonly canvas: HTMLCanvasElement;


  /**
   * three
   */
  public readonly camera: Camera;
  protected readonly renderer: THREE.WebGLRenderer;
  protected readonly scene: THREE.Scene;
  private skybox: THREE.Mesh;
  private skyboxtex: THREE.CubeTexture;

  /**
   * Texture clipping source fish eye
   */
  public readonly texctx: CanvasRenderingContext2D;
  /** Fish eye of conversion source */
  private source: HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|null;
  /** The value of n of the size of the texture which becomes 2 n */
  private exponent: number;
  /**
   * The value of n of the size of the texture which becomes 2 n
   * When rewriting this.resize (); doing
   */
  public defaultExponent: number | null;
  /** Area cut from square texture */
  protected region: { centerX: number; centerY: number; radius: number; };
  /**
   * ```js
   * ctx.drawImage(video, 
   *   sx, sy, sw, sh,
   *   dx, dy, dw, dh
   * );```
   */
  protected pos: [
    number,number,number,number,
    number,number,number,number
  ];


  public debug: boolean;

  constructor(camera: Camera, o?: { textureSizeExponent?: number; mesh?: number; debug?: boolean; }){
    if(o != null && o.textureSizeExponent != null){
      this.defaultExponent = o.textureSizeExponent;
    }else{
      this.defaultExponent = null;
    }
    if(o != null && o.debug != null){
      this.debug = o.debug;
    }else{
      this.debug = false;
    }

    this.camera = camera;
    this.renderer = new THREE.WebGLRenderer();
    this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    this.source = null;
    this.pos = [0,0,0,0,0,0,0,0];
    this.exponent = 0;
    this.texctx = <CanvasRenderingContext2D>document.createElement("canvas").getContext("2d");
    this.region = {centerX: 300, centerY: 300, radius: 300};

    if(this.debug){

      this.camera.lookAt(new THREE.Vector3())
      const controls = new OrbitControls(this.camera, this.canvas);

      this.camera.position.z = 2000;

      load_skybox_texture().then((tex)=>{
        this.skyboxtex = tex;
        return createSkyboxMesh(tex);
      }).then((skybox)=>{
        this.skybox = skybox;
        this.scene.add(skybox);
      });
    }
  }


  /**
   * @param source - Change fish eye of conversion source Change something
   */
  public set src(source: HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|null) {
    if(source == null){ return; }
    if(source === this.source){ return; }
    this.source = source;
    this.load();
  }
  public get src(): HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|null {
    return this.source;
  }


  public set centerX(centerX: number){
    this.region.centerX = centerX;
    this.updateFisheyeRegion();
  }
  public get centerX(): number {
    return this.region.centerX;
  }
  public set centerY(centerY: number){
    this.region.centerY = centerY;
    this.updateFisheyeRegion();
  }
  public get centerY(): number {
    return this.region.centerY;
  }
  public set radius(radius: number){
    this.region.radius = radius;
    this.updateFisheyeRegion();
  }
  public get radius(): number {
    return this.region.radius;
  }
  /**
   * Adjust the position of the fish eye circle
   */
  public set fisheyeRegion(prop: { centerX: number; centerY: number; radius: number; }) {
    this.region = prop;
    this.updateFisheyeRegion();
  }
  public get fisheyeRegion(): { centerX: number; centerY: number; radius: number; } { return this.region; }


  public set width(n: number){ this.canvasSize = {width: n, height: this.canvasSize.height}; }
  public get width(): number{ return this.canvasSize.width; }
  public set height(n: number){ this.canvasSize = {width: this.canvasSize.width, height: n}; }
  public get height(): number{ return this.canvasSize.height; }
  /**
   * Optimize the current renderer to the current pixel size
   */
  public set canvasSize(size: {width: number, height: number} ) {
    // Optimize the current renderer to the current pixel size
    this.renderer.setSize(size.width, size.height);
    if(this.camera instanceof THREE.PerspectiveCamera){
      this.camera.aspect = size.width/size.height;
      this.camera.updateProjectionMatrix();
    }
  }
  public get canvasSize(): {width: number, height: number} { return this.renderer.getSize(); }

  public destructor(): void {
    if(this.debug){
      this.scene.remove(this.skybox);
      this.skybox.geometry.dispose();
      this.skybox.material.dispose();
      this.skyboxtex.dispose();
    }
  }
  public abstract render(): void;
  public abstract drag(type: "start" | "move", offsetX: number, offsetY: number);

  protected abstract load(): void;
  protected abstract unload(): void;


  /**
   * Fit texture to size of cam.src
   */
  public resize(): void {
    const source = this.source;

    if(source == null){ return; }

    let {width, height} = source;

    if(source instanceof HTMLVideoElement){
      width  = source.videoWidth;
      height = source.videoHeight;
    }

    const size = Math.min(width, height);
    if(this.defaultExponent == null){
      for(var i=0; size > Math.pow(2, i); i++){} // Gain 2 ^ n size      
      this.exponent = i; // Target resolution      
    }else{
      this.exponent = this.defaultExponent;
    }
    this.updateFisheyeRegion();
  }

  /**
   * Calculation of fisheye clipping region
   */
  protected updateFisheyeRegion() {
    const pow = Math.pow(2, this.exponent);
    const {radius, centerX, centerY} = this.region;
    const clippedWidth  = radius*2;
    const clippedHeight = radius*2;
    const left = centerX - radius;
    const top  = centerY - radius;

    let [sx, sy] = [left, top];
    let [sw, sh] = [clippedWidth, clippedHeight];
    let [dx, dy] = [0, 0];
    let [dw, dh] = [pow, pow]; // Size of reduction destination
    // Negative margin supported
    if(left < 0){
      sx = 0;
      sw = clippedWidth - left;
      dx = -left*pow/clippedWidth;
      dw = sw*pow/clippedWidth;
    }
    if(top < 0){
      sy = 0;
      sh = clippedHeight - top;
      dy = -top*pow/clippedHeight;
      dh = sh*pow/clippedHeight;
    }
    this.pos = [sx, sy, sw, sh, dx, dy, dw, dh];
    // The size of 2 ^ n contracted extensions
    this.texctx.canvas.width  = pow;
    this.texctx.canvas.height = pow;
  }
}



export function load_skybox_texture(path=
  'textures/cube/Park3Med/'
  //'textures/cube/skybox/'
  //'textures/cube/SwedishRoyalCastle/'
): Promise<THREE.CubeTexture> {
  return new Promise<THREE.CubeTexture>((resolve, reject)=>{
    const loader = new THREE.CubeTextureLoader();
    loader.setPath(path);
    loader.load( [
      'px.jpg', 'nx.jpg',
      'py.jpg', 'ny.jpg',
      'pz.jpg', 'nz.jpg'
    ], resolve, (xhr) => {}, reject );
  });
}

export function createSkyboxMesh(skybox_texture: THREE.CubeTexture): THREE.Mesh {
  const cubeShader = THREE.ShaderLib[ 'cube' ];
  cubeShader.uniforms[ 'tCube' ].value = skybox_texture;
  const skyBoxMaterial = new THREE.ShaderMaterial({
    fragmentShader: cubeShader.fragmentShader,
    vertexShader: cubeShader.vertexShader,
    uniforms: cubeShader.uniforms,
    depthWrite: false,
    side: THREE.BackSide
  });
  // BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)
  const skybox = new THREE.Mesh( new THREE.BoxGeometry( 3000, 3000, 3000, 1, 1, 1 ), skyBoxMaterial);
  return skybox;
}

/**
 * Assume a sphere with radius 1
 * @param longitude - Longitude rad
 * @param latitude - Latitude rad
 * @return [x, y]
 */
export function sphere2Mercator(longitude: Radian, latitude: Radian): [number, number]{
  const x = longitude;
  const y = Math.log(Math.tan(Math.PI/4 + latitude/2))
  return [x, y];
}
/**
 * Assume a sphere with radius 1
 * @param x
 * @param y
 * @return [longitude, latitude]
 */
export function mercator2Sphere(x: number, y: number): [Radian, Radian]{
  const longitude = x;
  const latitude = Math.asin(Math.tanh(y));
  return [longitude, latitude];
}

/**
 * From a square fisheye image of vertical and horizontal 2
 * Projection (up) to upper hemispherical polar coordinates with radius 1
 * @param x ∈ [-1, 1]
 * @param y ∈ [-1, 1]
 * @return [longitude, latitude] - Spherical coordinates
 */
export function fisheye2Sphere(x: number, y: number, r=1): [Radian, Radian] | null {
  const [cx, cy] = [1, 1];
  [x, y] = [x-cx, y-cy];
  const [theta, l] = [Math.atan2(y, x), Math.sqrt(x*x + y*y)]; // Cartesian to Euler
  if(l >= 1){ return null; }
  const [longitude, latitude] = [theta, Math.acos(l/r)];
  return [longitude, latitude];
}

/**
 * From the upper hemispherical polar coordinate with radius 1
 * Projection (down) to square coordinates centered on the origin of vertical and horizontal 2
 * @param longitude - Spherical coordinates
 * @param latitude - Spherical coordinates
 * @return [x, y] ∈ [-1, 1]
 */
export function sphere2Fisheye(longitude: Radian, latitude: Radian, r=1): [number, number]{
  const [theta, l] = [longitude, r*Math.cos(latitude)];
  const [x, y] = [l*Math.cos(theta), l*Math.sin(theta)];
  return [x, y];
}

/**
 * @param alpha - Right-handed coordinate system z axis Left turning around here Euler angles
 * @param beta - Right hand coordinate system x axis Around left and left Euler angles
 * @param gamma - Right hand coordinate system y axis Around left and left Euler angles
 */
export function rotate(alpha: Radian, beta: Radian, gamma: Radian){

}
export type Radian    = number;

/**
 * Used to convert cylindrical texture to fisheye image.
 */
export function fisheye2equirectangular(x: number, y: number): [number, number] {
  const [w, h] = [1, 1];
  const r = 1/2;
  console.assert(0 <= x && x <= 1);
  console.assert(0 <= y && y <= 1);
  x -= r;
  y -= r;
  y = y;
  const [theta, l] = [Math.atan2(y, x), Math.sqrt(x*x + y*y)]; // Cartesian to Euler
  let [s, t] = [w*(theta/(2*Math.PI)), h*(l/r)];
  console.assert(-0.5 <= s && s <= 0.5);
  console.assert(0 <= t && t <= Math.sqrt(2));
  s += 0.5;
  t = (1 - t);
  return [s, t];
}