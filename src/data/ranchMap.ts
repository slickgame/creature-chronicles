import type { BuilderProjectId } from "@/data/builderProjects";
import type { RanchUpgradeId } from "@/types/ranchUpgrades";
export type RanchPlotId = "homestead" | "habitats" | "services" | "expansion";
type BuildingShortcutId =
  | "house"
  | "breeding"
  | "nursery"
  | "town"
  | "feline"
  | "canine"
  | "bovine"
  | "lapine"
  | "equine"
  | "office"
  | "jobs"
  | "guild"
  | "north-pasture"
  | "woodline-acre"
  | "chicken"
  | "sheep"
  | "goat"
  | "aviary"
  | "fence"
  | "watchtower";

type RanchPlot = {
  id: RanchPlotId;
  label: string;
  shortLabel: string;
  description: string;
};
export type BuildingShortcut = {
  id: BuildingShortcutId;
  plotId: RanchPlotId;
  title: string;
  hint: string;
  x: number;
  labelY: number;
  upgradeIds: RanchUpgradeId[];
  projectId?: BuilderProjectId;
};

export const RANCH_PLOTS: RanchPlot[] = [
  {
    id: "homestead",
    label: "Homestead Yard",
    shortLabel: "Homestead",
    description: "House, breeding pen, egg nursery, and town road.",
  },
  {
    id: "habitats",
    label: "Habitat Fields",
    shortLabel: "Habitats",
    description: "Feline, canine, bovine, lapine, and equine habitats.",
  },
  {
    id: "services",
    label: "Service Yard",
    shortLabel: "Services",
    description:
      "Ranch office, chores board, guild board, house, and town road.",
  },
  {
    id: "expansion",
    label: "Expansion Fields",
    shortLabel: "Expansion",
    description:
      "Future livestock habitats, new land deeds, and permanent security construction.",
  },
];

export const BUILDING_SHORTCUTS: BuildingShortcut[] = [
  {
    id: "house",
    plotId: "homestead",
    title: "Ranch House",
    hint: "Sleep recovery upgrades make the ranch more restful overnight.",
    x: 50,
    labelY: 48,
    upgradeIds: ["sleep_recovery"],
  },
  {
    id: "breeding",
    plotId: "homestead",
    title: "Breeding Pen",
    hint: "Comfort upgrades reduce the harsh base breeding cost and improve pregnancy chance.",
    x: 50,
    labelY: 77,
    upgradeIds: ["breeding_pen_comfort"],
  },
  {
    id: "nursery",
    plotId: "homestead",
    title: "Egg Nursery",
    hint: "Nursery upgrades add egg slots and reduce long pregnancy/incubation timers.",
    x: 27,
    labelY: 79,
    upgradeIds: ["nursery_egg_capacity", "nursery_incubation_speed"],
  },
  {
    id: "town",
    plotId: "homestead",
    title: "Town Road",
    hint: "Travel to town for market, guild, construction, and other services.",
    x: 73,
    labelY: 81,
    upgradeIds: [],
  },
  {
    id: "feline",
    plotId: "habitats",
    title: "Feline Habitat",
    hint: "Capacity upgrades make room for more feline-family creatures.",
    x: 31,
    labelY: 55,
    upgradeIds: ["feline_habitat_capacity"],
  },
  {
    id: "canine",
    plotId: "habitats",
    title: "Canine Habitat",
    hint: "Capacity upgrades support more canine-family helpers and security lines.",
    x: 64,
    labelY: 53,
    upgradeIds: ["canine_habitat_capacity"],
  },
  {
    id: "bovine",
    plotId: "habitats",
    title: "Bovine Habitat",
    hint: "Capacity upgrades support production and feed economy growth.",
    x: 21,
    labelY: 84,
    upgradeIds: ["bovine_habitat_capacity"],
  },
  {
    id: "lapine",
    plotId: "habitats",
    title: "Lapine Habitat",
    hint: "Capacity upgrades support garden, nursery, and lapine breeding lines.",
    x: 58,
    labelY: 77,
    upgradeIds: ["lapine_habitat_capacity"],
  },
  {
    id: "equine",
    plotId: "habitats",
    title: "Equine Habitat",
    hint: "Capacity upgrades support hauling, upkeep, and field work lines.",
    x: 81,
    labelY: 77,
    upgradeIds: ["equine_habitat_capacity"],
  },
  {
    id: "office",
    plotId: "services",
    title: "Ranch Office",
    hint: "Open the construction ledger, repairs, history, and ranch-wide effects.",
    x: 39,
    labelY: 61,
    upgradeIds: [],
  },
  {
    id: "jobs",
    plotId: "services",
    title: "Ranch Chores",
    hint: "Chores Board upgrades reduce high base work costs and improve chore output.",
    x: 63,
    labelY: 52,
    upgradeIds: ["ranch_chores_board"],
  },
  {
    id: "guild",
    plotId: "services",
    title: "Guild Board",
    hint: "Guild contracts are handled in town.",
    x: 80,
    labelY: 81,
    upgradeIds: [],
  },
  {
    id: "town",
    plotId: "services",
    title: "Town Road",
    hint: "Travel to town for market, guild, construction, and other services.",
    x: 51,
    labelY: 81,
    upgradeIds: [],
  },
  {
    id: "house",
    plotId: "services",
    title: "Ranch House",
    hint: "Sleep recovery upgrades make the ranch more restful overnight.",
    x: 23,
    labelY: 73,
    upgradeIds: ["sleep_recovery"],
  },
  {
    id: "north-pasture",
    plotId: "expansion",
    title: "North Pasture",
    hint: "Purchase the land deed before livestock habitats can be built.",
    x: 20,
    labelY: 38,
    upgradeIds: [],
    projectId: "north_pasture_land",
  },
  {
    id: "woodline-acre",
    plotId: "expansion",
    title: "Woodline Acre",
    hint: "A second plot for specialty habitats and stronger perimeter defenses.",
    x: 80,
    labelY: 38,
    upgradeIds: [],
    projectId: "woodline_acre_land",
  },
  {
    id: "chicken",
    plotId: "expansion",
    title: "Chicken Coop",
    hint: "A future avian-livestock habitat. Building it also increases predator attraction.",
    x: 25,
    labelY: 62,
    upgradeIds: [],
    projectId: "chicken_coop",
  },
  {
    id: "sheep",
    plotId: "expansion",
    title: "Sheep Fold",
    hint: "A future ovine habitat with grazing and shelter space.",
    x: 43,
    labelY: 75,
    upgradeIds: [],
    projectId: "sheep_fold",
  },
  {
    id: "goat",
    plotId: "expansion",
    title: "Goat Paddock",
    hint: "A future caprine habitat unlocked through the Woodline Acre.",
    x: 61,
    labelY: 75,
    upgradeIds: [],
    projectId: "goat_paddock",
  },
  {
    id: "aviary",
    plotId: "expansion",
    title: "Aviary Roost",
    hint: "A future flying-creature habitat unlocked through the Woodline Acre.",
    x: 78,
    labelY: 61,
    upgradeIds: [],
    projectId: "aviary_roost",
  },
  {
    id: "fence",
    plotId: "expansion",
    title: "Reinforced Fence",
    hint: "Permanent security that reduces future predator exposure.",
    x: 37,
    labelY: 45,
    upgradeIds: [],
    projectId: "reinforced_fence",
  },
  {
    id: "watchtower",
    plotId: "expansion",
    title: "Watchtower",
    hint: "Powerful permanent security support for nightly patrols.",
    x: 63,
    labelY: 43,
    upgradeIds: [],
    projectId: "watchtower",
  },
];
