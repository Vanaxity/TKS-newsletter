// Typed handles for the vendored React Bits components (they ship as plain JS), with the props we use
// taken from each component's documented prop table.
import type { ComponentType, CSSProperties, MouseEventHandler, ReactNode, RefObject } from "react";
import AnimatedContentJs from "./AnimatedContent";
import ASCIITextJs from "./ASCIIText";
import CometDialJs from "./CometDial";
import DitherJs from "./Dither";
import LaserFlowJs from "./LaserFlow";
import ProfileCardJs from "./ProfileCard";
import PulseHeartJs from "./PulseHeart";
import SpecularButtonJs from "./SpecularButton";

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


export type DitherProps = {
  waveColor?: string | [number, number, number];
  backgroundColor?: string | [number, number, number];
  ditherMode?: "bayer" | "bayer4" | "bayer2" | "halftone" | "lines" | "crosshatch" | "noise" | "none";
  palette?: string[];
  colorNum?: number;
  pixelSize?: number;
  scale?: number;
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  contrast?: number;
  brightness?: number;
  enableMouseInteraction?: boolean;
  mouseEffect?: "erase" | "reveal" | "ripple";
  mouseRadius?: number;
  mouseStrength?: number;
  trail?: number;
  clickRipple?: boolean;
  intro?: boolean;
  disableAnimation?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
};

export type LaserFlowProps = {
  surfaceRef?: RefObject<HTMLElement | null>;
  beamPosition?: number;
  surfaceLevel?: number;
  color?: string;
  intensity?: number;
  beamWidth?: number;
  flare?: number;
  spread?: number;
  spill?: number;
  fog?: number;
  dust?: number;
  streaks?: number;
  dots?: number;
  pulse?: number;
  speed?: number;
  seed?: number;
  mouseInteraction?: boolean;
  intro?: boolean;
  theme?: "dark" | "light";
  paused?: boolean;
  dpr?: number;
  className?: string;
};

export type ASCIITextProps = {
  text?: string;
  asciiFontSize?: number;
  charset?: string;
  colors?: string[];
  textColor?: string;
  fontFamily?: string;
  fontWeight?: number;
  textScale?: number;
  blocks?: number;
  waves?: number;
  waveSpeed?: number;
  chroma?: number;
  tilt?: number;
  hueShift?: number;
  scramble?: number;
  clickRipple?: boolean;
  intro?: boolean;
  idle?: boolean;
  interactive?: boolean;
  theme?: "dark" | "light";
  className?: string;
};

export type SpecularButtonProps = {
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  idleIntensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  glow?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  speed?: number;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  className?: string;
  style?: CSSProperties;
};

export type AnimatedContentProps = {
  children?: ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  blur?: number;
  threshold?: number;
  delay?: number;
  stagger?: number;
  trigger?: "scroll" | "mount";
  once?: boolean;
  className?: string;
};

export const Dither = DitherJs as unknown as ComponentType<DitherProps>;
export const LaserFlow = LaserFlowJs as unknown as ComponentType<LaserFlowProps>;
export const ASCIIText = ASCIITextJs as unknown as ComponentType<ASCIITextProps>;
export const SpecularButton = SpecularButtonJs as unknown as ComponentType<SpecularButtonProps>;
export const AnimatedContent = AnimatedContentJs as unknown as ComponentType<AnimatedContentProps>;
