import type { CSSProperties } from "react";
import styles from "./RanchIcon.module.css";
const icons = { house: 0, paw: 1, egg: 2, town: 3, bag: 4, sun: 5, energy: 6, gold: 7, leaf: 8, gear: 9, moon: 10, chores: 11, feed: 12, tax: 13, nest: 14, tools: 15 };
export type RanchIconName = keyof typeof icons;
export function RanchIcon({ name, className = "" }: { name: RanchIconName; className?: string }) {
  const index = icons[name];
  return <span aria-hidden="true" className={`${styles.icon} ${className}`} style={{ backgroundPosition: `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%` } as CSSProperties} />;
}
