import type { ComponentType } from "react";
import AnimatedContentJs from "./AnimatedContent";
import type { AnimatedContentProps } from "./typed-home";

export const AnimatedContent = AnimatedContentJs as unknown as ComponentType<AnimatedContentProps>;
