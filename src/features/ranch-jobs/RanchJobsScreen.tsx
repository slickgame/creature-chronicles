"use client";
import { FarmResourcesPanel } from "@/features/resources/FarmResourcesPanel";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import styles from "./FarmManagement.module.css";
export function RanchJobsScreen() {
  return <main className={styles.screen}><header><h1>Farm Management</h1><ScreenNavigation /></header><div className={styles.content}><FarmResourcesPanel mode="ranch"/></div></main>;
}
