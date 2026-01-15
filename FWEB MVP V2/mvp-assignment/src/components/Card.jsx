import styles from "../pages/Dashboard.module.css";

export default function Card({ children }) {
  return <div className={styles.card}>{children}</div>;
}
