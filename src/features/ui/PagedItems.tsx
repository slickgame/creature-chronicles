"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./PagedItems.module.css";

/** Pagination uses available panel height; only dialogs are allowed to scroll. */
export function PagedItems({ items, rowHeight = 154, label }: {
  items: ReactNode[];
  rowHeight?: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(1);
  const [requestedPage, setRequestedPage] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height <= 0) return;
      setCapacity(Math.max(1, Math.floor((entry.contentRect.height - 48) / rowHeight)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rowHeight]);
  const pages = Math.max(1, Math.ceil(items.length / capacity));
  const page = Math.min(requestedPage, pages - 1);
  return <div className={styles.paged} ref={ref} aria-label={label}>
    <div className={styles.items}>{items.slice(page * capacity, (page + 1) * capacity)}</div>
    <nav className={styles.controls} aria-label={`${label} pages`}>
      <button type="button" disabled={page === 0} onClick={() => setRequestedPage(page - 1)}>← Previous</button>
      <span aria-live="polite">{page + 1} / {pages}</span>
      <button type="button" disabled={page >= pages - 1} onClick={() => setRequestedPage(page + 1)}>Next →</button>
    </nav>
  </div>;
}
