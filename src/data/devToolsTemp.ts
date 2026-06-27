import type { GameSave } from "@/types/save";

export type DevActionResult = { save: GameSave; ok: boolean; message: string };
export function noopDevAction(save: GameSave): DevActionResult { return { save, ok: true, message: "OK" }; }
