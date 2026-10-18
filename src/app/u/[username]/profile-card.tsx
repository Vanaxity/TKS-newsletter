"use client";

import { ProfileCard } from "@/components/react-bits/typed";

type Props = { avatarUrl: string; name: string; title: string; handle: string; status: string };

// React Bits Profile Card; its button jumps to the member's reposts.
export function MemberCard(props: Props) {
  return (
    <ProfileCard
      {...props}
      statusColor="#51B04C"
      contactText="Reposts"
      onContactClick={() => document.getElementById("reposts")?.scrollIntoView({ behavior: "smooth" })}
      backdropColor="#17191A"
      theme="dark"
      enableTilt
    />
  );
}
