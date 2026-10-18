import type { ComponentType } from "react";
import SpecularButtonJs from "./SpecularButton";
import type { SpecularButtonProps } from "./typed-home";

export const SpecularButton = SpecularButtonJs as unknown as ComponentType<SpecularButtonProps>;
