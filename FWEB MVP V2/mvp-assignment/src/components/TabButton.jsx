import styles from "../pages/Dashboard.module.css";

export default function TabButton({ id, label, activeTab, setActiveTab }) {
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`${styles.tabBtn} ${activeTab === id ? styles.tabBtnActive : ""}`}
      type="button"
    >
      {label}
    </button>
  );
}
