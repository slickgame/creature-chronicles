export type TownNpcId = "tamsin_vale" | "pella_mosswick" | "mara_vell" | "veyra" | "selene_virell" | "maribel_quince" | "kaida_thorn";

export type TownNpcTrustRecord = {
  npcId: TownNpcId;
  points: number;
  level: number;
  introduced: boolean;
  lastChangedDayNumber?: number;
};

export type TownNpcTrustState = Partial<Record<TownNpcId, TownNpcTrustRecord>>;

export type TownNpcDefinition = {
  npcId: TownNpcId;
  name: string;
  title: string;
  systemRole: string;
  portraitPath: string;
  profilePath: string;
  intro: string;
  trustUnlocks: Record<number, string>;
};
