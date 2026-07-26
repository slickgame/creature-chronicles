"use client";

import { CollectionScreen as CoreCollectionScreen } from "./CollectionScreen";
import styles from "./CollectionScreenPolished.module.css";

/**
 * Layout-only wrapper for the Ranch Roster.
 *
 * Keeping these corrections outside the management feature logic makes the
 * roster easier to tune without disturbing filtering, comparison, or routing.
 */
export function CollectionScreen() {
  return (
    <div className={styles.polishRoot} data-creature-management-polish="true">
      <CoreCollectionScreen />
    </div>
  );
}
