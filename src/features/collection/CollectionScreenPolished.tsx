"use client";
import { CollectionScreen as CoreCollectionScreen } from "./CollectionScreen";
import type { ReactNode } from "react";
export function CollectionScreen({ headerLinks }: { headerLinks?: ReactNode }) {
  return <CoreCollectionScreen headerLinks={headerLinks} />;
}
