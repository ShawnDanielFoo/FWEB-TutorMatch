import styles from "../../pages/Dashboard.module.css";
import Card from "../Card";
import PillBtn from "../PillBtn";

export default function DashboardView({
  // form
  editingId,
  subject,
  setSubject,
  description,
  setDescription,
  availability,
  setAvailability,
  handleCreateOrUpdate,
  resetForm,

  // listings + filters
  loading,
  filteredListings,
  user,
  ownershipFilter,
  setOwnershipFilter,
  minRating,
  setMinRating,
  tutorAvgMap,

  // actions
  handleStartEdit,
  handleDelete,
  handleViewTutor,
  handleRequestTutor,
  idStr,

  // tutor modal state
  viewingTutor,
  setViewingTutor,
  tutorLoading,
  tutorAvg,
  tutorRatingsCount,
}) {
  // tutor profile modal used only by DashboardView
  // purely for displaying tutor information
  const TutorModal = () =>
    viewingTutor ? (
      <div className={styles.modalOverlay} onClick={() => setViewingTutor(null)}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.centerText}>Tutor Profile</h2>

          <div className={styles.modalGrid}>
            <div className={styles.centerText}>
              <div className={styles.modalName}>{viewingTutor?.fullName || "Tutor"}</div>
              <div className={styles.modalEmail}>{viewingTutor?.email}</div>
            </div>

            <Card>
              <p className={styles.pLine}>
                <b>Course:</b> {viewingTutor?.course || "-"}
              </p>
              <p className={styles.pLine}>
                <b>Description:</b> {viewingTutor?.description || "-"}
              </p>
              <p className={styles.pLine}>
                <b>Average Rating:</b>{" "}
                {tutorLoading ? "Loading..." : tutorAvg === null ? "No ratings yet" : `${Number(tutorAvg).toFixed(1)} / 5`}
                {tutorAvg !== null && <span className={styles.muted}> ({tutorRatingsCount})</span>}
              </p>
            </Card>

            <div className={styles.centerRow}>
              <button className={styles.btnGhost} onClick={() => setViewingTutor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <h2 className={styles.centerText} style={{ marginTop: 18 }}>
        {editingId ? "Edit Tutor Listing" : "Create Tutor Listing"}
      </h2>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Card>
          <form onSubmit={handleCreateOrUpdate} className={styles.gridForm}>
            <input
              placeholder="Subject (e.g. FWEB CIT2C20)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={styles.input}
            />
            <input
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.input}
            />
            <input
              placeholder="Availability (e.g. Mon & Fri 3PM - 6PM)"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className={styles.input}
            />

            <div className={styles.rowGap}>
              <button type="submit" className={styles.btnPrimary}>
                {editingId ? "Save Changes" : "Add Listing"}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm} className={styles.btnGhost}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>
      </div>

      <h2 className={styles.centerText} style={{ marginTop: 28 }}>
        All Tutor Listings
      </h2>

      {/* FILTER BAR */}
      <div style={{ maxWidth: 920, margin: "0 auto 12px auto" }}>
        <Card>
          <div className={styles.rowGap} style={{ justifyContent: "space-between" }}>
            <div className={styles.rowGap}>
              <PillBtn active={ownershipFilter === "all"} onClick={() => setOwnershipFilter("all")}>
                All
              </PillBtn>
              <PillBtn active={ownershipFilter === "mine"} onClick={() => setOwnershipFilter("mine")}>
                My Listings
              </PillBtn>
              <PillBtn active={ownershipFilter === "others"} onClick={() => setOwnershipFilter("others")}>
                Others
              </PillBtn>
            </div>

            <div className={styles.rowGap}>
              <span className={styles.muted} style={{ fontSize: 12 }}>
                Rating:
              </span>

              <select className={styles.select} value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                <option value="all">All</option>
                <option value="4">4★ and above</option>
                <option value="3">3★ and above</option>
                <option value="2">2★ and above</option>
                <option value="1">1★ and above</option>
                <option value="none">No ratings yet</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {loading ? (
          <p className={styles.centerText} style={{ opacity: 0.8 }}>
            Loading...
          </p>
        ) : filteredListings.length === 0 ? (
          <p className={styles.centerText} style={{ opacity: 0.8 }}>
            No listings match your filters.
          </p>
        ) : (
          <div className={styles.listGrid}>
            {filteredListings.map((l) => {
              const isOwner = idStr(l?.tutorId) === idStr(user?._id);
              const tutorId = idStr(l?.tutorId);
              const avg = tutorAvgMap?.[tutorId]?.average ?? 0;
              const count = tutorAvgMap?.[tutorId]?.count ?? 0;

              return (
                <Card key={l._id}>
                  <div className={styles.listRow}>
                    <div className={styles.listText}>
                      <p className={styles.listTitle}>
                        <b>{l.subject}</b>
                      </p>
                      <p className={styles.listDesc}>{l.description}</p>
                      <p className={styles.listDesc} style={{ marginBottom: 0 }}>
                        <b>Availability:</b> {l.availability}
                      </p>

                      <p className={styles.listTutor}>
                        Tutor: {l?.tutorId?.fullName || "Unknown"}{" "}
                        <span className={styles.muted}>
                          • Rating: {count ? `${Number(avg).toFixed(1)}/5 (${count})` : "No ratings"}
                        </span>
                      </p>
                    </div>

                    {isOwner ? (
                      <div className={styles.actionsRow}>
                        <button onClick={() => handleStartEdit(l)} className={styles.btnPrimary}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(l._id, l.tutorId)} className={styles.btnDanger}>
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className={styles.actionsRow}>
                        <button onClick={() => handleViewTutor(l)} className={styles.btnGhostSmall}>
                          View Profile
                        </button>
                        <button onClick={() => handleRequestTutor(l)} className={styles.btnRequest}>
                          Request
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {TutorModal()}
    </>
  );
}
