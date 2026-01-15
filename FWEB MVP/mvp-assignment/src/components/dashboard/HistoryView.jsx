import styles from "../../pages/Dashboard.module.css";
import Card from "../Card";
import StarBar from "../StarBar";

export default function HistoryView({
  sessionsLoading,
  history,
  user,
  ratingsMap,
  ratingBusyId,
  submitRating,
  idStr,
}) {
  return (
    <div style={{ maxWidth: 920, margin: "18px auto" }}>
      <Card>
        <h2 className={styles.centerText}>History</h2>

        {sessionsLoading ? (
          <p className={styles.centerText} style={{ opacity: 0.85, marginTop: 12 }}>
            Loading...
          </p>
        ) : history.length === 0 ? (
          <p className={styles.centerText} style={{ opacity: 0.85, marginTop: 12 }}>
            No completed sessions yet.
          </p>
        ) : (
          <div className={styles.listGrid} style={{ marginTop: 12 }}>
            {history.map((r) => {
              const isTutor = idStr(r?.tutorId) === idStr(user?._id);
              const isLearner = idStr(r?.learnerId) === idStr(user?._id);
              const ratedScore = ratingsMap[String(r._id)];

              return (
                <Card key={r._id}>
                  <div className={styles.centerText}>
                    <p className={styles.sessionTitle}>
                      <b>{r.subject}</b>
                    </p>
                    <p className={styles.sessionLine}>
                      <b>Time:</b> {r.sessionTime || "-"}
                    </p>
                    <p className={styles.sessionLine}>
                      <b>{isTutor ? "Learner" : "Tutor"}:</b> {isTutor ? r?.learnerId?.fullName : r?.tutorId?.fullName}
                    </p>
                    <p className={styles.sessionStatus}>
                      Status: <b>{r.status}</b>
                    </p>

                    {isLearner && (
                      <>
                        {ratedScore ? (
                          <div style={{ marginTop: 10, opacity: 0.9 }}>
                            Rating: <b>{ratedScore}</b>/5
                            <StarBar value={ratedScore} disabled onSelect={() => {}} />
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, opacity: 0.9 }}>
                            Rate this session:
                            <StarBar
                              value={0}
                              disabled={ratingBusyId === r._id}
                              onSelect={(score) => submitRating(r._id, score)}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
