import styles from "../pages/Dashboard.module.css";

export default function StarBar({ value, onSelect, disabled }) {
  return (
    <div className={styles.starBar}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= (value || 0);
        return (
          <button
            key={n}
            onClick={() => !disabled && onSelect(n)}
            className={`${styles.star} ${on ? styles.starOn : styles.starOff} ${
              disabled ? styles.starDisabled : ""
            }`}
            aria-label={`${n} star`}
            title={`${n} star`}
            type="button"
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
