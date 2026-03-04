export interface ViewConfig {
  id: string;
  label: string;
  azimuth: number;   // -180 to 180
  elevation: number; // -90 to 90
  fov: number;       // 30 to 120
}

export interface CropResult {
  viewId: string;
  image: string; // base64 data URI
  cameraParams: { azimuth: number; elevation: number; fov: number };
}
