import React, { useRef, memo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import MSDFText, { type MSDFTextProps } from "./MSDFText";
import useGradingReviewStore from "@/store/gradingReviewStore";
import { createCustomPropsCompare } from "@/pages/debug/lot-block-migration/utils/propsComparators";

// Reused quaternion to avoid per-frame allocations (same approach as Drei's Billboard)
const _parentWorldQuat = new THREE.Quaternion();

/**
 * MSDFText wrapped with billboard behavior - always faces the camera.
 * Uses camera world rotation (like Drei's Billboard) instead of lookAt to avoid
 * gimbal flip when the camera is at extreme angles (e.g. directly above).
 */
const MSDFBillboardText = ({
  ref,
  ...props
}: MSDFTextProps & { ref?: React.RefObject<THREE.Group | null> }) => {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  const setRef = (el: THREE.Group | null) => {
    (outerRef as React.MutableRefObject<THREE.Group | null>).current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<THREE.Group | null>).current = el;
  };

  useFrame(({ camera }) => {
    if (!outerRef.current || !innerRef.current) return;
    outerRef.current.updateMatrixWorld(true);
    outerRef.current.getWorldQuaternion(_parentWorldQuat);
    camera
      .getWorldQuaternion(innerRef.current.quaternion)
      .premultiply(_parentWorldQuat.clone().invert());

    if (innerRef.current) {
      // Hide when exaggerating as TSL exaggerating not working well with MSDFText
      const { scaleExaggeration } = useGradingReviewStore.getState();
      innerRef.current.visible = scaleExaggeration == 1;
    }
  });

  return (
    <group ref={setRef} position={props.position ?? [0, 0, 0]}>
      <group ref={innerRef}>
        <MSDFText {...props} position={[0, 0, 0]} />
      </group>
    </group>
  );
};

MSDFBillboardText.displayName = "MSDFBillboardText";

const MSDFBillboardTextMemoized = memo(
  MSDFBillboardText,
  createCustomPropsCompare([], ["position", "rotation", "scale"]),
);
export { MSDFBillboardTextMemoized as MSDFBillboardText };
export default MSDFBillboardTextMemoized;
