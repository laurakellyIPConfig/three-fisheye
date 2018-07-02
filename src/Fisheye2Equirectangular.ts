import * as THREE from "three";
import {Fisheye, mercator2Sphere, sphere2Fisheye} from "./Fisheye";

export type Orientation = 'ceiling' | 'floor' | 'wall';

/**
 * Equirectangular Cylindrical Mercator
* http://wiki.panotools.org/Projections
*/
export class Fisheye2Equirectangular extends Fisheye<THREE.OrthographicCamera> {
  protected mesh_num: number;
  private meshes: THREE.Mesh[];
  private texis: THREE.Texture[];
  private canvasShift: number;
  private cameraOrientation: Orientation;

  constructor(o?: { orientation?: Orientation }){
    // left, right, top, bottom, near, far
    const camera = new THREE.OrthographicCamera(600/-2, 600/2, 400/2, 400/-2, 1, 10000);
    camera.position.z = 0.01;
    super(camera, o);
    this.meshes = [];
    this.texis = [];
    this.canvasShift = 0;

    if(o != null && o.orientation !== null && o.orientation !== undefined){
        this.cameraOrientation = o.orientation;
    } else {
        this.cameraOrientation = 'ceiling';
    }
  }

  render(): void {
    if(this.src == null){ return; }
    const [sx, sy, sw, sh, dx, dy, dw, dh] = this.pos;
    this.texctx.canvas.width = this.texctx.canvas.width; // clear
    const {width, height} = this.texctx.canvas;
    this.texctx.drawImage(this.src, sx, sy, sw, sh, dx, dy, dw, dh);
    this.texis.forEach((tex)=>{ tex.needsUpdate = true; });
    this.renderer.render(this.scene, this.camera);
  }
  protected load(): void {
    const source = this.src;
    if(source == null){ return; }
    this.unload(); // Erase previous panoramas
    // Optimize the current renderer to the current pixel size
    this.resize();
    const tex = new THREE.Texture(this.texctx.canvas);
    const mesh = createPanoramaMesh(tex, 0, 0.25, 1, this.canvasShift);
    const mesh2 = mesh.clone();
    const {width, height} = (<THREE.PlaneGeometry>mesh.geometry).parameters;
    this.renderer.setSize( width, height );
    this.camera.left = width/-2;
    this.camera.right = width/2;
    this.camera.top = height/2;
    this.camera.bottom = height/-2;

    this.updateCameraOrientation();

    this.camera.updateProjectionMatrix();
    this.scene.add(mesh);
    this.scene.add(mesh2);
    this.meshes.push(mesh);
    this.meshes.push(mesh2);
    this.texis.push(tex);
  }
  protected unload(): void {
    this.meshes.forEach((mesh)=>{
      this.scene.remove( mesh );
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.texis.forEach((tex)=>{
      tex.dispose();
    });
    this.meshes = [];
    this.texis = [];
  }
  private updateCameraOrientation(): void {
    switch(this.cameraOrientation) {
        case 'ceiling':
            this.camera.rotation.z = Math.PI;
            break;
        case 'wall':
        case 'floor':
            this.camera.rotation.z = 0;
            break;
    }
    this.camera.updateProjectionMatrix();
  }
  public setOrientation(orientation: Orientation): void {
    this.orientation = orientation;
  }
  set orientation(orientation: Orientation) {
    this.cameraOrientation = orientation;
    this.updateCameraOrientation();
  }
  set shift(shift: number) {
    var temp = shift % (<THREE.PlaneGeometry>this.meshes[0].geometry).parameters.width;
    this.meshes[0].position.x = temp > 0 ? temp - (<THREE.PlaneGeometry>this.meshes[0].geometry).parameters.width : temp;
    this.meshes[1].position.x = this.meshes[0].position.x + (<THREE.PlaneGeometry>this.meshes[0].geometry).parameters.width;
  }
  public reload() {
    this.load();
  }
  drag(type: "start" | "move", offsetX: number, offsetY: number) {

  }
}

export function createPanoramaMesh(fisheye_texture, panorama_width=0, R1_ratio=0, R2_ratio=1, shift){

  // Assume a square texture
  //const panorama_width = 400; Panorama board Polar width in space, default is R2 circumference length
  //const R1_ratio = 0; // Fan-shaped lower quarter 0 - 1
  //const R2_ratio = 1; // Fan shaped upper quarter 0 - 1 lower string <upper string
  const {width, height} = (()=>{
    // fisheye -> panorama
    // Calculate w / h aspect ratio of panorama of
    const {width, height} = fisheye_texture.image;
    const [Hs, Ws] = [width, height]; // fisheye Image Short Diameter    
    const [Cx, Cy] = [Ws/2, Hs/2]; // fisheye Central coordinates
    const R = Hs/2; // Radius from center coordinates
    const [R1, R2] = [R*R1_ratio, R*R2_ratio]; // fisheye Two radii determining the area to cut out in a donut shape from
    const [Wd, Hd] = [(R2 + R1)*Math.PI, R2 - R1] // The size obtained by converting the donut-shaped region into a short diameter
    return {height:Hd, width:Wd};
  })();
  const h_per_w_ratio = height/width;
  // Set default value of panorama_width
  if(panorama_width <= 0){
    panorama_width = width;
  }
  const plane = new THREE.PlaneGeometry(panorama_width, panorama_width*h_per_w_ratio, 128, 128);
  const {vertices, faces, faceVertexUvs} = plane;
  // Convert UV to fan type
  const [Hs, Ws] = [1, 1]; // Size of UV
  const [Cx, Cy] = [Ws/2, Hs/2]; // Center coordinates of UV  
  const R = Hs/2; // Radius from center coordinates  
  const [R1, R2] = [R*R1_ratio, R*R2_ratio]; // Radius determining the region to cut out from the UV in a donut shape
  const [Wd, Hd] = [1, 1] // The size obtained by converting the donut-shaped region into a short diameter
  faceVertexUvs[0] = faceVertexUvs[0].map((pt2Dx3)=>{
    return pt2Dx3.map(({x, y})=>{
      const [xD, yD] = [x, y];
      // x, y ∈ [0, 1] is the UV coordinate on the PlaneGeometry normalized to a square
      // For example, (x, y) = (0, 0) is the PlaneGeometry upper left coordinate.
      // This (x, y) coordinates should return the (fisheye) texture coordinates that should be displayed.
      // Since the texture is a fisheye image this time, the texture coordinates to be displayed by the UV coordinates (0,0) are (0, 0) in Euler coordinates and (cx, cy) in orthogonal coordinates.
      // Consider which position on the texture should be displayed (mapped) for a certain pixel on Plane Geometry.
      const r = (yD/Hd)*(R2-R1) + R1;
      const theta = (xD/Wd)*2.0*Math.PI + shift;
      const xS = Cx + r*Math.sin(theta);
      const yS = Cy + r*Math.cos(theta);
      return new THREE.Vector2(xS, yS);
      
    });
  });
  const mat = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, map: fisheye_texture } );
  const mesh = new THREE.Mesh(plane, mat);
  mesh.rotation.x = Math.PI; // Rotate to be a hemisphere on the north latitude side
  mesh.rotation.y = Math.PI; // Peeled baby here  
  mesh.position.z = -panorama_width; // Distance from camera
  return mesh;
}


