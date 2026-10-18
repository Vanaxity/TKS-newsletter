// Typed handles for the vendored React Bits components (they ship as plain JS), with the props we use
// taken from each component's documented prop table.
import type { ComponentType, ReactNode } from "react";
import CometDialJs from "./CometDial";
import ProfileCardJs from "./ProfileCard";
import PulseHeartJs from "./PulseHeart";

export type CometDialProps = {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  accent?: string;
  ink?: string;
  size?: number;
  sweep?: number;
  thickness?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number, detail: { velocity: number; bounce: number }) => void;
  className?: string;
};

export type PulseHeartProps = {
  liked?: boolean;
  defaultLiked?: boolean;
  count?: number;
  onChange?: (liked: boolean, count: number) => void;
  showCount?: boolean;
  icon?: "heart" | "star" | "thumb" | ReactNode;
  idleOutline?: boolean;
  size?: number;
  likedColor?: string;
  idleColor?: string;
  pillColor?: string;
  textColor?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export type ProfileCardProps = {
  avatarUrl?: string;
  iconUrl?: string;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  statusColor?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  [prop: string]: unknown;
};

export const CometDial = CometDialJs as unknown as ComponentType<CometDialProps>;
export const PulseHeart = PulseHeartJs as unknown as ComponentType<PulseHeartProps>;
export const ProfileCard = ProfileCardJs as unknown as ComponentType<ProfileCardProps>;
