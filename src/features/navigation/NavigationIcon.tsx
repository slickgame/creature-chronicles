import { RanchIcon, type RanchIconName } from "@/features/ui/RanchIcon";
const icons: Record<string, RanchIconName> = { Inventory: "bag", Creatures: "paw", "Ranch Status": "chores", Journal: "tax", Travel: "town", "Save & Options": "gear" };
export function NavigationIcon({ name }: { name: string }) { return <RanchIcon name={icons[name] ?? "chores"} />; }
