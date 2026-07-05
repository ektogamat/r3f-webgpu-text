import { describe, expect, it, vi, beforeEach } from "vitest";
import * as THREE from "three";
import type { BMFontJSON } from "./fontCache";

const mockDispose = vi.fn();

vi.mock("three-msdf-text-utils", () => {
  class MockMSDFTextGeometry extends THREE.BufferGeometry {
    constructor() {
      super();
      const positions = new Float32Array([0, -10, 20, -10, 20, 0, 0, 0]);
      const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
      this.setAttribute("position", new THREE.BufferAttribute(positions, 2));
      this.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      this.setIndex([0, 1, 2, 0, 2, 3]);
      this.boundingBox = new THREE.Box3(new THREE.Vector3(0, -10, 0), new THREE.Vector3(20, 0, 0));
    }

    computeBoundingBox() {}

    dispose() {
      mockDispose();
      super.dispose();
    }
  }

  return { MSDFTextGeometry: MockMSDFTextGeometry };
});

import { buildMergedLabelGeometry } from "./buildMergedLabelGeometry";

const mockFont: BMFontJSON = {
  pages: ["Manrope-Bold.png"],
  chars: [],
  info: { size: 42 },
  common: { lineHeight: 71, base: 0, scaleW: 512, scaleH: 512 },
};

describe("buildMergedLabelGeometry", () => {
  beforeEach(() => {
    mockDispose.mockClear();
  });

  it("returns null for empty labels", () => {
    expect(buildMergedLabelGeometry([], mockFont, { fontSize: 6 })).toBeNull();
  });

  it("builds merged geometry with uint32 indices for multiple labels", () => {
    const geometry = buildMergedLabelGeometry(
      [
        { x: 100, y: 200, text: "Lot 1" },
        { x: 300, y: 400, text: "Lot 2" },
      ],
      mockFont,
      { fontSize: 6, z: 1.8 },
    );

    expect(geometry).not.toBeNull();
    expect(geometry!.getAttribute("position").count).toBe(8);
    expect(geometry!.getAttribute("uv").count).toBe(8);
    expect(geometry!.index?.array).toBeInstanceOf(Uint32Array);
    expect(geometry!.index?.count).toBe(12);
    expect(mockDispose).toHaveBeenCalledTimes(2);
  });

  it("bakes label anchor near the label world position", () => {
    const geometry = buildMergedLabelGeometry([{ x: 50, y: 75, text: "A" }], mockFont, {
      fontSize: 6,
      z: 2,
    });

    expect(geometry).not.toBeNull();
    const positions = geometry!.getAttribute("position").array as Float32Array;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      xs.push(positions[i]!);
      ys.push(positions[i + 1]!);
    }
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    expect(centerX).toBeCloseTo(50, 0);
    expect(centerY).toBeCloseTo(75, 0);
    expect(positions[2]).toBe(2);
  });
});
