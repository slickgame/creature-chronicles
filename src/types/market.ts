import type { CreatureFamily } from "./creature";
import type { SpeciesId, VariantId } from "./ids";

export type MarketListingStatus = "available" | "sold";

export type MarketListing = {
  listingId: string;
  weekNumber: number;
  slotIndex: number;
  speciesId: SpeciesId;
  variantId: VariantId;
  family: CreatureFamily;
  displayName: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic";
  price: number;
  status: MarketListingStatus;
  createdAt: string;
};

export type MarketState = {
  weekNumber: number;
  rerollCount: number;
  lastRestockedDayNumber: number;
  lastRestockedAt: string;
  listings: MarketListing[];
};

export type MarketActionResult = {
  save: import("./save").GameSave;
  ok: boolean;
  message: string;
};
