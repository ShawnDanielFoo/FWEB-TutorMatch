import styles from "../../pages/Dashboard.module.css";
import Card from "../Card";
import SegBtn from "../SegBtn";
import PillBtn from "../PillBtn";

export default function SessionsView({
  sessionsTab,
  setSessionsTab,
  statusFilter,
  setStatusFilter,
  sessionsLoading,
  sessionFiltered,
  handleUpdateRequestStatus,
  handleDeleteSessionRequest,
}) {
  return (
    <div style={{ maxWidth: 920, margin: "18px auto" }}>
      <Card>
        <h2 className={styles.centerText}>Sessions</h2>

        <div className={styles.centerRow} style={{ marginTop: 12 }}>
          <SegBtn active={sessionsTab === "inbox"} onClick={() => setSessionsTab("inbox")}>
            Inbox
          </SegBtn>
          <SegBtn active={sessionsTab === "outbox"} onClick={() => setSessionsTab("outbox")}>
            My Requests
          </SegBtn>
        </div>

        <div className={styles.pillsRow} style={{ marginTop: 14 }}>
          {[
            ["All", "All"],
            ["Accepted", "Approved"],
            ["Pending", "Pending"],
            ["Rejected", "Denied"],
          ].map(([v, label]) => (
            <PillBtn key={v} active={statusFilter === v} onClick={() => setStatusFilter(v)}>
              {label}
            </PillBtn>
          ))}
        </div>

        {sessionsLoading ? (
          <p style={{ opacity: 0.85, marginTop: 12 }}>Loading...</p>
        ) : sessionFiltered.length === 0 ? (
          <p style={{ opacity: 0.85, marginTop: 12 }}>No sessions found.</p>
        ) : (
          <div className={styles.listGrid} style={{ marginTop: 12 }}>
            {sessionFiltered.map((r) => (
              <Card key={r._id}>
                <div className={styles.sessionRow}>
                  <div className={styles.sessionCenter}>
                    <p className={styles.sessionTitle}>
                      <b>{r.subject}</b>
                    </p>

                    <p className={styles.sessionLine}>
                      <b>Requested Time:</b> {r.sessionTime || "-"}
                    </p>

                    {sessionsTab === "inbox" ? (
                      <p className={styles.sessionLine}>
                        <b>Learner:</b> {r?.learnerId?.fullName || "Unknown"}
                      </p>
                    ) : (
                      <p className={styles.sessionLine}>
                        <b>Tutor:</b> {r?.tutorId?.fullName || "Unknown"}
                      </p>
                    )}

                    <p className={styles.sessionStatus}>
                      Status: <b>{r.status}</b>
                    </p>

                    {sessionsTab === "inbox" && r.status === "Pending" && (
                      <div className={styles.centerRow} style={{ marginTop: 12 }}>
                        <button onClick={() => handleUpdateRequestStatus(r._id, "Accepted")} className={styles.btnPrimary}>
                          Approve
                        </button>
                        <button onClick={() => handleUpdateRequestStatus(r._id, "Rejected")} className={styles.btnDanger}>
                          Deny
                        </button>
                      </div>
                    )}

                    {sessionsTab === "inbox" && r.status === "Accepted" && (
                      <div className={styles.centerRow} style={{ marginTop: 12 }}>
                        <button onClick={() => handleUpdateRequestStatus(r._id, "Completed")} className={styles.btnPrimary}>
                          Completed
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteSessionRequest(r._id)}
                    className={styles.xBtn}
                    aria-label="Remove"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
