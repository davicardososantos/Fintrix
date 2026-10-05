"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function DetailsDialog({
  children,
  titleId,
  onClose,
}: {
  children: ReactNode;
  titleId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="dialog-enter fixed inset-x-0 bottom-0 top-auto m-0 max-h-dialog w-full max-w-none overflow-y-auto rounded-t-lg border border-border bg-card p-0 text-card-foreground shadow-floating backdrop:bg-overlay/70 backdrop:backdrop-blur-sm sm:inset-0 sm:m-auto sm:max-w-dialog sm:rounded-lg"
    >
      <div className="safe-bottom p-5 sm:p-6">{children}</div>
    </dialog>
  );
}
