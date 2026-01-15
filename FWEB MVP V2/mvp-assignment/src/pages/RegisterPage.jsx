import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./RegisterPage.module.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    course: "",
    description: "",
    password: "",
    confirmPassword: "",
  });

  const [showPw, setShowPw] = useState(false); // Password visibility toggle
  const [loading, setLoading] = useState(false); 
  const [msg, setMsg] = useState(""); 

  // submit only if all required fields are filled and not loading
  const canSubmit = useMemo(() => {
    const ok =
      form.fullName.trim() &&
      form.email.trim() &&
      form.course.trim() &&
      form.description.trim() &&
      form.password &&
      form.confirmPassword &&
      !loading;
    return !!ok;
  }, [form, loading]);

  // Update form fields on change
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  
  const postJson = async (path, payload) => {
    const res = await fetch(`http://localhost:3000${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json")
      ? await res.json()
      : { success: false, message: await res.text() };

    return { res, data };
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg("");

  
    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      course: form.course.trim(),
      description: form.description.trim(),
      password: form.password,
    };

    if (!payload.fullName || !payload.email || !payload.course || !payload.description) {
      return setMsg("Please fill in all fields.");
    }
    if (payload.password.length < 6) {
      return setMsg("Password must be at least 6 characters.");
    }
    if (form.password !== form.confirmPassword) {
      return setMsg("Passwords do not match.");
    }

    try {
      setLoading(true);

  
      let out = await postJson("/users/register", payload);

      // fallback route
      if (out.res.status === 404) {
        out = await postJson("/users", payload);
      }

      const { res, data } = out;
     
      if (!res.ok || !data?.success) {
        setMsg(data?.message || "Registration failed. Please try again.");
        return;
      }

      setMsg("✅ Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/"); // Redirect to login
      }, 1500);
    } catch (err) {
      console.error(err);
      setMsg("Server error. Please make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = msg.startsWith("✅");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.brandWrap}>
            <div className={styles.brandTitle}>TutorMatch</div>
            <div className={styles.subTitle}>Create your account to continue</div>
          </div>

          <form onSubmit={handleRegister} className={styles.form}>
            {/* Full Name */}
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input
                name="fullName"
                placeholder="e.g. John Tan"
                value={form.fullName}
                onChange={onChange}
                className={styles.input}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@student.tp.edu.sg"
                value={form.email}
                onChange={onChange}
                className={styles.input}
                autoComplete="email"
              />
            </div>

            {/* Course */}
            <div className={styles.field}>
              <label className={styles.label}>Course</label>
              <input
                name="course"
                placeholder="e.g. Information Technology"
                value={form.course}
                onChange={onChange}
                className={styles.input}
              />
            </div>

            {/* Description */}
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <input
                name="description"
                placeholder="e.g. Year 2 IT student looking for help in FWEB"
                value={form.description}
                onChange={onChange}
                className={styles.input}
              />
            </div>

            {/* Password + Toggle */}
            <div className={styles.field}>
              <label className={styles.label}>Password</label>

              <div className={styles.pwWrap}>
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={onChange}
                  className={styles.pwInput}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className={styles.pwToggle}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.field}>
              <label className={styles.label}>Confirm Password</label>
              <input
                name="confirmPassword"
                type={showPw ? "text" : "password"}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={onChange}
                className={styles.input}
                autoComplete="new-password"
              />
            </div>

            {/* Feedback message */}
            {msg && (
              <div className={`${styles.msg} ${isSuccess ? styles.msgSuccess : styles.msgError}`}>
                {msg}
              </div>
            )}

            {/* Submit button */}
            <button type="submit" disabled={!canSubmit} className={styles.btnPrimary}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            {/* Link to login page */}
            <div className={styles.footerCenter}>
              <span className={styles.footerText}>Already have an account?</span>
              <Link to="/" className={styles.footerLink}>
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
