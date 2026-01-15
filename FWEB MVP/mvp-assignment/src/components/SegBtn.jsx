import styles from "../pages/Dashboard.module.css";

export default function SegBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`${styles.segBtn} ${active ? styles.segBtnActive : ""}`}
      type="button"
    >
      {children}
    </button>
  );
}
