import styles from "../../pages/Dashboard.module.css";
import Card from "../Card";

export default function ProfileView({
  user,

  profileEditing,
  setProfileEditing,
  profileMsg,
  setProfileMsg,
  profileSaving,

  profileForm,
  setProfileForm,
  handleProfileChange,

  handleSaveProfile,
  handleDeleteProfile,

  // rating display
  myTutorLoading,
  myTutorAvg,
  myTutorCount,
}) {
  return (
    <div style={{ maxWidth: 920, margin: "18px auto" }}>
      <Card>
        <h2 style={{ marginTop: 0 }}>Profile</h2>

        {!profileEditing ? (
          <>
            {["Name", "Email", "Course", "Description"].map((k) => (
              <p key={k} className={styles.pLine}>
                <b>{k}:</b>{" "}
                {{
                  Name: user?.fullName,
                  Email: user?.email,
                  Course: user?.course,
                  Description: user?.description,
                }[k]}
              </p>
            ))}

            <p className={styles.pLine}>
              <b>Average Rating:</b>{" "}
              {myTutorLoading ? "Loading..." : myTutorAvg === null ? "No ratings yet" : `${myTutorAvg.toFixed(1)} / 5`}
              {!myTutorLoading && myTutorAvg !== null && <span className={styles.muted}> ({myTutorCount})</span>}
            </p>

            <div className={styles.rowGap} style={{ marginTop: 16 }}>
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  setProfileMsg("");
                  setProfileEditing(true);
                  setProfileForm({
                    fullName: user?.fullName || "",
                    email: user?.email || "",
                    course: user?.course || "",
                    description: user?.description || "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                disabled={profileSaving}
              >
                Edit Profile
              </button>

              <button className={styles.btnDanger} onClick={handleDeleteProfile} disabled={profileSaving}>
                Delete Profile
              </button>
            </div>

            {profileMsg && <p className={styles.msg}>{profileMsg}</p>}
          </>
        ) : (
          <>
            <div className={styles.gridForm} style={{ marginTop: 10 }}>
              {[
                ["fullName", "Full Name"],
                ["email", "Email"],
                ["course", "Course"],
                ["description", "Description"],
              ].map(([name, ph]) => (
                <input
                  key={name}
                  name={name}
                  placeholder={ph}
                  value={profileForm[name]}
                  onChange={(e) => setProfileForm((p) => ({ ...p, [name]: e.target.value }))}
                  className={styles.input}
                />
              ))}

              <input
                type="password"
                name="password"
                placeholder="New Password (optional)"
                value={profileForm.password}
                onChange={handleProfileChange}
                className={styles.input}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password (optional)"
                value={profileForm.confirmPassword}
                onChange={handleProfileChange}
                className={styles.input}
              />
            </div>

            <div className={styles.rowGap} style={{ marginTop: 16 }}>
              <button className={styles.btnPrimary} onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>

              <button
                className={styles.btnGhost}
                onClick={() => {
                  setProfileEditing(false);
                  setProfileMsg("");
                  setProfileForm({
                    fullName: user?.fullName || "",
                    email: user?.email || "",
                    course: user?.course || "",
                    description: user?.description || "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                disabled={profileSaving}
              >
                Cancel
              </button>
            </div>

            {profileMsg && <p className={styles.msg}>{profileMsg}</p>}
          </>
        )}
      </Card>
    </div>
  );
}
