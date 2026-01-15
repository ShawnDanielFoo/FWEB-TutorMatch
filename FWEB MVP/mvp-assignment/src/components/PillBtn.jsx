import styles from "../pages/Dashboard.module.css";

export default function PillBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.pillBtn} ${active ? styles.pillBtnActive : ""}`}
      type="button"
    >
      {children}
    </button>
  );
}
