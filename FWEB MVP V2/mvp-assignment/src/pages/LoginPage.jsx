import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Enable submit only when inputs are valid
  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !loading;
  }, [email, password, loading]);

  // Handle login (supports Mongo backend + JSON Server)
  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    const eTrim = email.trim().toLowerCase();
    if (!eTrim || !password) {
      setMsg("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: eTrim, password }),
      });

      // JSON server fallback 
      if (res.status === 404) {
        const res2 = await fetch(
          `http://localhost:3000/users?email=${encodeURIComponent(
            eTrim
          )}&password=${encodeURIComponent(password)}`
        );

        const users = await res2.json();

        if (!res2.ok || !Array.isArray(users) || users.length === 0) {
          setMsg("Invalid email or password.");
          return;
        }

        // JSON Server success
        localStorage.setItem("user", JSON.stringify(users[0]));
        navigate("/dashboard");
        return;
      }

      //Mongo response handling
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json()
        : { success: false, message: await res.text() };

      if (!res.ok || !data?.success) {
        setMsg(data?.message || "Login failed. Please try again.");
        return;
      }

      // Express / Mongo success
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setMsg("Server error. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.brandWrap}>
            <div className={styles.brandTitle}>TutorMatch</div>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                placeholder="you@student.tp.edu.sg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={styles.input}
              />
            </div>

            {/* Password with toggle */}
            <div className={styles.field}>
              <label className={styles.label}>Password</label>

              <div className={styles.pwWrap}>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={styles.pwInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className={styles.pwToggle}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Message */}
            {msg && <div className={styles.msg}>{msg}</div>}

            {/* Submit */}
            <button type="submit" disabled={!canSubmit} className={styles.btnPrimary}>
              {loading ? "Logging in..." : "Log In"}
            </button>

            {/* Register link */}
            <div className={styles.footerRow}>
              <span className={styles.footerText}>No account yet?</span>
              <Link to="/register" className={styles.footerLink}>
                Create one
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
