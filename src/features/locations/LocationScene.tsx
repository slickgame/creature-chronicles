"use client";
import type { ReactNode } from "react";
import { useNavigation } from "@/features/navigation/NavigationContext";
import styles from "./LocationScene.module.css";
export { default as locationStyles } from "./LocationScene.module.css";
export function LocationScene({ title, subtitle, background, portrait, name, resources, onBack, backLabel = "Town", children }: { title: string; subtitle: string; background: string; portrait: string; name: string; resources: string; onBack: () => void; backLabel?: string; children: ReactNode }) {
  const { open } = useNavigation();
  return <main className={styles.location} style={{ backgroundImage: `linear-gradient(0deg,#251a1240,transparent 65%),url('${background}')` }} data-location-scene>
    <header className={styles.header}><button onClick={onBack}>‹ {backLabel}</button><div><small>{subtitle}</small><h1>{title}</h1></div><button data-navigation-launcher onClick={() => open("menu")}>Menu</button></header>
    <p className={styles.resources}>{resources}</p>
    <div className={styles.body}><div className={styles.figure}><img src={portrait} alt={name} /><span>{name}</span></div><section className={styles.panel}>{children}</section></div>
  </main>;
}
