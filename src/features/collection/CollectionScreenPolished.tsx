"use client";

import { CollectionScreen as CoreCollectionScreen } from "./CollectionScreen";
import styles from "./CollectionScreenPolished.module.css";
import type { ReactNode } from "react";

/**
 * Layout-only wrapper for the Ranch Roster.
 *
 * Keeping these corrections outside the management feature logic makes the
 * roster easier to tune without disturbing filtering, comparison, or routing.
 */
export function CollectionScreen({ headerLinks }: { headerLinks?: ReactNode }) {
  return (
    <div className={styles.polishRoot} data-creature-management-polish="true">
      <CoreCollectionScreen headerLinks={headerLinks} />
    </div>
  );
}
