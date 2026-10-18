import { SpecularButton } from "@/components/react-bits/specular-button";

// The hero's main call to action: React Bits Specular Button, lit in TKS green. A real link, so it works
// before JavaScript loads and can open in a new tab.
export function JoinButton() {
  return (
    <SpecularButton
      href="/signup"
      size="lg"
      radius={999}
      tint="#51B04C"
      tintOpacity={0.18}
      textColor="#f2f2f2"
      lineColor="#7fd27a"
      baseColor="#2f4a2d"
      intensity={1.2}
      idleIntensity={0.45}
      glow={1}
      autoAnimate
    >
      Join with your TKS code
    </SpecularButton>
  );
}
