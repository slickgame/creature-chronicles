"use client";

export function PopupWindow({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-5xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div
        className={`flex h-[88vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 border-stone-900 bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function HubCard({
  icon,
  title,
  subtitle,
  meta,
  accentClasses,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  meta: string;
  accentClasses: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border-2 p-5 text-left shadow transition hover:-translate-y-0.5 hover:shadow-xl ${accentClasses}`}
    >
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="text-2xl font-bold text-stone-900">{title}</p>
      <p className="mt-1 text-sm text-stone-700">{subtitle}</p>
      <p className="mt-3 text-xs font-semibold text-stone-600">{meta}</p>
    </button>
  );
}
