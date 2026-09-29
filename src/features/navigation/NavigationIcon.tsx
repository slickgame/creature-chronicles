const paths: Record<string, string> = {
  Inventory: "M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2",
  Creatures:
    "M8 14c-3 4-1 7 2 6 1-1 3-1 4 0 3 1 5-2 2-6-2-3-6-3-8 0ZM5 7a2 3 0 1 0 0 .1ZM10 4a2 3 0 1 0 0 .1ZM16 5a2 3 0 1 0 0 .1ZM20 10a2 3 0 1 0 0 .1",
  "Ranch Status":
    "M6 3h14v18H6a3 3 0 0 1 0-6h14M6 3a3 3 0 0 0-3 3v12M9 7h7M9 11h5",
  Journal: "M5 3h14v18H5V3Zm4 5h6M9 12h6M9 16h4",
  Travel: "m3 4 6-2 6 2 6-2v18l-6 2-6-2-6 2V4Zm6-2v18M15 4v18",
  "Save & Options": "M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8",
};
export function NavigationIcon({ name }: { name: string }) {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.Journal} />
    </svg>
  );
}
