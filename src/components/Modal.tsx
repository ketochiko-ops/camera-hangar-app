import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./Manage.module.css";
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose(): void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${styles.modal} ${wide ? styles.wide : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className={styles.modalHeader}>
        <div>
          <span>OPTICAL ARSENAL / DATA TERMINAL</span>
          <h2>{title}</h2>
        </div>
        <button type="button" aria-label="閉じる" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
