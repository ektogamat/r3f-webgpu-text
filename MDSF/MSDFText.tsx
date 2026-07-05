import { memo, useRef, useEffect, useState, useImperativeHandle } from "react";
import * as THREE from "three";
import type { Group } from "three";
import { MSDFTextGeometry } from "three-msdf-text-utils";
import { MSDFTextNodeMaterial } from "three-msdf-text-utils/webgpu";
import { createCustomPropsCompare } from "@/pages/debug/lot-block-migration/utils/propsComparators";
import {
  type BMFontJSON,
  DEFAULT_FONT_ATLAS,
  DEFAULT_FONT_DATA,
  loadFontCached,
} from "./fontCache";

export interface MSDFTextProps {
  children: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  fontSize?: number;
  color?: string;
  anchorX?: "left" | "center" | "right" | number;
  anchorY?: "top" | "middle" | "bottom" | "top-baseline" | "bottom-baseline" | number;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  maxWidth?: number;
  renderOrder?: number;
  scale?: [number, number, number] | number;
  fontAtlas?: string;
  fontData?: string;
  userData?: Record<string, unknown>;
  visible?: boolean;
  onClick?: (e: { stopPropagation: () => void }) => void;
  onPointerOver?: (e: { stopPropagation: () => void }) => void;
  onPointerOut?: (e: { stopPropagation: () => void }) => void;
}

const DEFAULT_FONT_SIZE = 42;

/** Parse anchor value to 0-1 normalized offset */
function parseAnchor(
  anchor:
    | "left"
    | "center"
    | "right"
    | "top"
    | "middle"
    | "bottom"
    | "top-baseline"
    | "bottom-baseline"
    | number,
  isX: boolean,
): number {
  if (typeof anchor === "number") return anchor;
  const map: Record<string, number> = {
    left: 0,
    center: 0.5,
    right: 1,
    top: 1,
    middle: 0.5,
    bottom: 0,
    "top-baseline": 1,
    "bottom-baseline": 0,
  };
  return map[anchor] ?? 0.5;
}

const MSDFText = ({
  ref,
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  fontSize = 1,
  color = "#ffffff",
  anchorX = "center",
  anchorY = "middle",
  textAlign = "center",
  lineHeight = 1.1,
  letterSpacing = 0,
  maxWidth,
  renderOrder = 0,
  scale: scaleProp,
  fontAtlas = DEFAULT_FONT_ATLAS,
  fontData = DEFAULT_FONT_DATA,
  userData,
  visible = true,
  onClick,
  onPointerOver,
  onPointerOut,
}: MSDFTextProps & { ref?: React.RefObject<Group | null> }) => {
  const groupRef = useRef<Group>(null);
  const [innerMesh, setInnerMesh] = useState<THREE.Mesh | null>(null);

  useImperativeHandle(ref, () => groupRef.current!, []);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    loadFontCached(fontData, fontAtlas).then(({ font: fontJson, atlas }) => {
      if (!mounted || !groupRef.current) {
        return;
      }

      try {
        // Scale from font units (atlas size) to world units
        const fontScale = fontSize / (fontJson.info?.size ?? DEFAULT_FONT_SIZE);

        // Convert relative values to absolute font-pixel units for MSDFTextGeometry
        const absoluteLineHeight = lineHeight * (fontJson.common?.lineHeight ?? 71);
        const absoluteLetterSpacing = letterSpacing * (fontJson.info?.size ?? DEFAULT_FONT_SIZE);
        const absoluteMaxWidth = maxWidth != null ? maxWidth / fontScale : undefined;

        const geometry = new MSDFTextGeometry({
          text: String(children ?? ""),
          font: fontJson as BMFontJSON,
          align: textAlign,
          lineHeight: absoluteLineHeight,
          letterSpacing: absoluteLetterSpacing,
          width: absoluteMaxWidth,
          mode: maxWidth ? "normal" : "pre",
        });

        const material = new MSDFTextNodeMaterial({
          map: atlas,
          color,
          opacity: 1,
          transparent: true,
        });

        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        // Extract the actual min/max of the rendered glyphs (not always 0-based)
        const minX = bbox?.min.x ?? 0;
        const minY = bbox?.min.y ?? 0;
        const maxY = bbox?.max.y ?? 0;
        const layoutWidth = bbox ? bbox.max.x - minX : 0;

        const anchorXVal = parseAnchor(anchorX, true);
        const anchorYVal = parseAnchor(anchorY, false);

        // Correct offset accounting for bbox origin (glyphs don't always start at 0,0)
        // X: shift so that the anchor fraction of the width lands at the group origin
        const offsetX = -(minX + layoutWidth * anchorXVal) * fontScale;
        // Y: the rotation.x += Math.PI flip maps y → -y, so we must account for
        // bbox.min.y and bbox.max.y separately instead of assuming the range is [-h, 0]
        const offsetY = ((1 - anchorYVal) * maxY + anchorYVal * minY) * fontScale;

        const newMesh = new THREE.Mesh(geometry, material);
        // Anchor offset in local space; group will hold world position
        newMesh.position.set(offsetX, offsetY, 0);
        newMesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        newMesh.scale.setScalar(fontScale);

        if (scaleProp !== undefined) {
          if (typeof scaleProp === "number") {
            newMesh.scale.multiplyScalar(scaleProp);
          } else {
            newMesh.scale.x *= scaleProp[0];
            newMesh.scale.y *= scaleProp[1];
            newMesh.scale.z *= scaleProp[2];
          }
        }

        newMesh.renderOrder = renderOrder;
        newMesh.visible = visible;
        if (userData) newMesh.userData = userData;

        // Fix upside-down text (MSDF typically has Y flipped)
        newMesh.rotation.x += Math.PI;

        groupRef.current.add(newMesh);
        setInnerMesh(newMesh);

        cleanup = () => {
          if (groupRef.current && newMesh.parent) {
            groupRef.current.remove(newMesh);
          }
          // Do not dispose geometry/material here — deferred dispose races with
          // useDeferredWebGpuRendererDispose when a Canvas unmounts (multiview close).
        };
      } catch (err) {
        console.error("MSDFText failed to create:", err);
      }
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [
    children,
    fontAtlas,
    fontData,
    fontSize,
    color,
    anchorX,
    anchorY,
    textAlign,
    lineHeight,
    letterSpacing,
    maxWidth,
    // Omit position, rotation, userData, scaleProp - they use new refs every render
    // and cause constant effect reruns/flicker. Position is on the group (reactive).
    // Rotation and userData are applied in the innerMesh effect below.
    renderOrder,
    visible,
  ]);

  useEffect(() => {
    if (innerMesh) {
      innerMesh.visible = visible ?? true;
      innerMesh.renderOrder = renderOrder ?? 0;
      // Apply rotation (mesh has Math.PI on X for MSDF flip; Z is the main prop rotation)
      innerMesh.rotation.set(
        (rotation?.[0] ?? 0) + Math.PI,
        rotation?.[1] ?? 0,
        rotation?.[2] ?? 0,
      );
      if (userData) innerMesh.userData = { ...userData };
    }
  }, [innerMesh, visible, renderOrder, rotation?.[0], rotation?.[1], rotation?.[2]]);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      visible={visible}
    >
      {/* Mesh is added as child in useEffect */}
    </group>
  );
};

MSDFText.displayName = "MSDFText";

const MSDFTextMemoized = memo(
  MSDFText,
  createCustomPropsCompare([], ["position", "rotation", "scale"]),
);
export { MSDFTextMemoized as MSDFText };
export default MSDFTextMemoized;
