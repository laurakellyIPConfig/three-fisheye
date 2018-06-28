import * as THREE from "three";
import { Fisheye } from "./Fisheye";
/**
 * Equirectangular Cylindrical Mercator
* http://wiki.panotools.org/Projections
*/
export declare class Fisheye2Equirectangular extends Fisheye<THREE.OrthographicCamera> {
    protected mesh_num: number;
    private meshes;
    private texis;
    private canvasShift;
    constructor(o?: {});
    render(): void;
    protected load(): void;
    protected unload(): void;
    shift: number;
    reload(): void;
    drag(type: "start" | "move", offsetX: number, offsetY: number): void;
}
export declare function createPanoramaMesh(fisheye_texture: any, panorama_width: number | undefined, R1_ratio: number | undefined, R2_ratio: number | undefined, shift: any): THREE.Mesh;
