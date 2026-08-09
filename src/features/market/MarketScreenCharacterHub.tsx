"use client";

import { AdoptionHearthCharacterHub } from "./AdoptionHearthCharacterHub";
import { MarketScreen as BaseMarketScreen } from "./MarketScreen";

export function MarketScreen() {
  return (
    <>
      <BaseMarketScreen />
      <AdoptionHearthCharacterHub />
    </>
  );
}
