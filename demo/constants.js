export const HDR_URL =
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/ludwikowice_farmland_1k.hdr";

export const MODEL_URL = new URL(
  "./sikorsky_ch-53e_sea_stallion_compressed.glb",
  import.meta.url,
).href;

export const BASIS_TRANSCODER_PATH = "/basis/";

export const QUALITY_PRESETS = {
  low: {
    label: "Low",
    chromaticAberration: false,
  },
  med: {
    label: "Med",
    chromaticAberration: false,
  },
  ultra: {
    label: "Ultra",
    chromaticAberration: true,
    caStrength: 1.2,
    caScale: 0.25,
    caEdgeInner: 0.52,
    caEdgeOuter: 0.62,
  },
};
