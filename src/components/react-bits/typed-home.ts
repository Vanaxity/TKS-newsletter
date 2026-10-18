// Prop types for the homepage's React Bits components. Types only: importing this file adds no code,
// so pages pull in just the components they actually render.
import type { CSSProperties, MouseEventHandler, ReactNode, RefObject } from "react";

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
  onClick?: MouseEventHandler<HTMLElement>;
  /** TKS change: renders a link instead of a button. */
  href?: string;
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
  style?: CSSProperties;
};
