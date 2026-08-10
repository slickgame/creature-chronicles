"use client";

import { AdoptionHearthCharacterHub } from "./AdoptionHearthCharacterHub";
import { AdoptionHearthSubpageExperience } from "./AdoptionHearthSubpageExperience";
import { AdoptionListingsCarousel } from "./AdoptionListingsCarousel";
import { MarketScreen as BaseMarketScreen } from "./MarketScreen";

export function MarketScreen() {
  return (
    <>
      <BaseMarketScreen />
      <AdoptionHearthCharacterHub />
      <AdoptionListingsCarousel />
      <AdoptionHearthSubpageExperience />
    </>
  );
}
