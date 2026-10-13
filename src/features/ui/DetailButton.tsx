"use client";

import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import styles from "./DetailButton.module.css";

/** Quick read on hover/focus; the existing click action opens full touch-accessible details. */
export function DetailButton({ hint, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { hint: string }) {
  const id = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number; bottom: number; above: boolean; host: Element } | null>(null);
  function close() { if (timer.current) clearTimeout(timer.current); setPosition(null); }
  function show() {
    if (timer.current) clearTimeout(timer.current);
    const button = anchor.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - 292)), top: rect.bottom + 6, bottom: window.innerHeight - rect.top + 6, above: rect.bottom > window.innerHeight - 190, host: button.closest("dialog") ?? document.body });
  }
  useEffect(() => {
    if (!position) return;
    const dismiss = () => setPosition(null);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); dismiss(); } };
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("keydown", escape, true);
    return () => { window.removeEventListener("resize", dismiss); window.removeEventListener("scroll", dismiss, true); window.removeEventListener("keydown", escape, true); };
  }, [position]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <><button {...props} ref={anchor} aria-describedby={position ? id : props["aria-describedby"]}
    onPointerEnter={event => { props.onPointerEnter?.(event); if (event.pointerType === "mouse") show(); }}
    onPointerLeave={event => { props.onPointerLeave?.(event); timer.current = setTimeout(close, 180); }}
    onFocus={event => { props.onFocus?.(event); if (event.currentTarget.matches(":focus-visible")) show(); }}
    onBlur={event => { props.onBlur?.(event); close(); }}
    onClick={event => { close(); props.onClick?.(event); }}>{children}</button>
    {position ? createPortal(<div id={id} role="tooltip" className={styles.tooltip}
      style={{ left: position.left, top: position.above ? undefined : position.top, bottom: position.above ? position.bottom : undefined }}
      onPointerEnter={() => { if (timer.current) clearTimeout(timer.current); }} onPointerLeave={close}>{hint}</div>, position.host) : null}</>;
}
