import type { ArchType } from "./types";

export const ARCH_TYPE_LABELS: Record<ArchType, string> = {
  PES_PLANUS: "Flatland Enthusiast",
  PES_RECTUS: "Basic Arch",
  PES_CAVUS: "Bridge Architect",
};

export const getArchTypeLabel = (archType: ArchType) => ARCH_TYPE_LABELS[archType];
