import type { LocalizedText } from "./profile";

export interface Skill {
  id: string;
  name: string;
  shortName?: string;
}

export interface SkillGroup {
  id: "programming" | "interactive" | "productivity" | "visual" | "engineering";
  title: LocalizedText;
  skills: readonly Skill[];
}

/** Skill names reflect the user's supplied list; no proficiency level is inferred. */
export const skillGroups: readonly SkillGroup[] = [
  {
    id: "programming",
    title: { zh: "编程语言", en: "Programming Languages" },
    skills: [
      { id: "cpp", name: "C++" },
      { id: "python", name: "Python" },
      { id: "kotlin", name: "Kotlin" },
    ],
  },
  {
    id: "interactive",
    title: { zh: "游戏与交互", en: "Game & Interactive" },
    skills: [{ id: "godot", name: "Godot" }],
  },
  {
    id: "productivity",
    title: { zh: "办公与效率", en: "Office & Productivity" },
    skills: [{ id: "office", name: "Office" }],
  },
  {
    id: "visual",
    title: { zh: "视觉设计、影像与动画", en: "Visual Design, Media & Animation" },
    skills: [
      { id: "illustrator", name: "Adobe Illustrator", shortName: "Ai" },
      { id: "photoshop", name: "Adobe Photoshop", shortName: "Ps" },
      { id: "after-effects", name: "Adobe After Effects", shortName: "Ae" },
      { id: "premiere-pro", name: "Adobe Premiere Pro", shortName: "Pr" },
      { id: "csp", name: "Clip Studio Paint", shortName: "CSP" },
      { id: "blender", name: "Blender" },
      { id: "spine", name: "Spine" },
    ],
  },
  {
    id: "engineering",
    title: { zh: "工程与科研仿真", en: "Engineering & Scientific Simulation" },
    skills: [
      { id: "matlab", name: "MATLAB" },
      { id: "fluent", name: "Fluent" },
      { id: "tracepro", name: "TracePro" },
      { id: "zemax", name: "Zemax" },
      { id: "fdtd", name: "FDTD" },
      { id: "solidworks", name: "SolidWorks" },
      { id: "ug", name: "UG" },
      { id: "autodesk", name: "Autodesk" },
    ],
  },
];

export const allSkills: readonly Skill[] = skillGroups.flatMap((group) => group.skills);
