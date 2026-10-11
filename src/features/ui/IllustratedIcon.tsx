import styles from "./IllustratedIcon.module.css";
const sources = {
 talk: "/images/ui/atelier-v1/talk.webp", ledger: "/images/ui/atelier-v1/ledger.webp", leaf: "/images/ui/atelier-v1/leaf.webp",
 egg: "/images/ui/atelier-v1/egg.webp", timer: "/images/ui/atelier-v1/hourglass.webp", cradle: "/images/ui/atelier-v1/cradle.webp",
 comfort: "/images/ui/atelier-v1/comfort.webp", garden: "/images/ui/atelier-v1/garden.webp",
 feed: "/images/items/supply_depot/feed_bundle.png", materials: "/images/items/supply_depot/material_crate.png", repair: "/images/items/supply_depot/repair_kit.png",
 supplies: "/images/items/supply_depot/nursery_supply_kit.png", special: "/images/items/supply_depot/mutation_catalyst.webp",
 patrol: "/images/ui/atelier-v1/patrol.webp", breeding: "/images/ui/icons/icon_parent_compare.png", capacity: "/images/ui/icons/icon_habitat_capacity.png",
};
export type IllustratedIconName = keyof typeof sources;
export function IllustratedIcon({ name, className = "" }: { name: IllustratedIconName; className?: string }) {
 return <img data-illustrated-icon className={`${styles.icon} ${className}`} src={sources[name]} alt="" aria-hidden="true" />;
}
export function TrustLeaves({ level }: { level: number }) {
 return <span className={styles.trust} role="img" aria-label={`Trust level ${level} of 5`}>{Array.from({ length: 5 }, (_, i) => <span key={i} data-earned={i < level}><IllustratedIcon name="leaf" /></span>)}</span>;
}
