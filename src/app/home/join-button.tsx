"use client";

import { useRouter } from "next/navigation";
import { SpecularButton } from "@/components/react-bits/typed-home";

// The hero's main call to action: React Bits Specular Button, lit in TKS green.
export function JoinButton() {
  const router = useRouter();
  return (
    <SpecularButton
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
      onClick={() => router.push("/signup")}
    >
      Join with your TKS code
    </SpecularButton>
  );
}
