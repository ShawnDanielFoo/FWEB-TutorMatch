import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

//Components
import TabButton from "../components/TabButton";
import DashboardView from "../components/dashboard/DashboardView";
import SessionsView from "../components/dashboard/SessionsView";
import HistoryView from "../components/dashboard/HistoryView";
import ProfileView from "../components/dashboard/ProfileView";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [activeTab, setActiveTab] = useState("dashboard");

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [inboxRequests, setInboxRequests] = useState([]);
  const [outboxRequests, setOutboxRequests] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsTab, setSessionsTab] = useState("inbox");
  const [statusFilter, setStatusFilter] = useState("All");

  const [ratingsMap, setRatingsMap] = useState({});
  const [ratingBusyId, setRatingBusyId] = useState("");

  const [profileEditing, setProfileEditing] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    course: "",
    description: "",
    password: "",
    confirmPassword: "",
  });

  // tutor modal
  const [viewingTutor, setViewingTutor] = useState(null);
  const [tutorAvg, setTutorAvg] = useState(null);
  const [tutorRatingsCount, setTutorRatingsCount] = useState(0);
  const [tutorLoading, setTutorLoading] = useState(false);

  // listing filters
  const [ownershipFilter, setOwnershipFilter] = useState("all"); // all | mine | others
  const [minRating, setMinRating] = useState("all"); // all | 4 | 3 | 2 | 1 | none
  const [tutorAvgMap, setTutorAvgMap] = useState({}); // { tutorId: { average, count } }

  // profile rating (this user as a tutor)
  const [myTutorAvg, setMyTutorAvg] = useState(null);
  const [myTutorCount, setMyTutorCount] = useState(0);
  const [myTutorLoading, setMyTutorLoading] = useState(false);

  const api = (path, options) => fetch(`http://localhost:3000${path}`, options);

  // robust id normaliser (handles populated objects)
  const idStr = (v) => String(typeof v === "object" ? v?._id : v);

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!user?._id) navigate("/");
  }, [navigate, user?._id]);

  // prefill profile form when user changes
  useEffect(() => {
    setProfileForm((p) => ({
      ...p,
      fullName: user?.fullName || "",
      email: user?.email || "",
      course: user?.course || "",
      description: user?.description || "",
      password: "",
      confirmPassword: "",
    }));
  }, [user?._id]);

  // Listings
  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await api("/tutorlists");
      const data = await res.json();
      if (!res.ok) return alert(data?.message || "Failed to load tutor listings");
      const arr = Array.isArray(data) ? data : [];
      setLists(arr);
    } catch (e) {
      console.error(e);
      alert("Failed to load tutor listings");
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  // Load averages for tutors in listings (for filter + display)
  const fetchTutorAveragesForListings = async (listingArr) => {
    try {
      const tutorIds = [
        ...new Set(
          (listingArr || [])
            .map((l) => idStr(l?.tutorId))
            .filter((tid) => tid && tid !== "undefined" && tid !== "null")
        ),
      ];

      // only fetch missing
      const missing = tutorIds.filter((tid) => tutorAvgMap[tid] === undefined);
      if (!missing.length) return;

      const results = await Promise.all(
        missing.map(async (tid) => {
          try {
            const res = await api(`/ratings/tutor/${tid}`);
            const data = await res.json();
            if (!res.ok) return [tid, { average: 0, count: 0 }];
            return [tid, { average: Number(data?.average || 0), count: Number(data?.count || 0) }];
          } catch {
            return [tid, { average: 0, count: 0 }];
          }
        })
      );

      const next = {};
      results.forEach(([tid, val]) => (next[tid] = val));
      setTutorAvgMap((p) => ({ ...p, ...next }));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch current user's tutor avg (Profile tab)
  const fetchMyTutorAverage = async () => {
    if (!user?._id) return;
    try {
      setMyTutorLoading(true);
      const res = await api(`/ratings/tutor/${user._id}`);
      const data = await res.json();
      if (!res.ok) return (setMyTutorAvg(null), setMyTutorCount(0));

      const avg = Number(data?.average || 0);
      const count = Number(data?.count || 0);
      setMyTutorCount(count);
      setMyTutorAvg(count ? avg : null);
    } catch (e) {
      setMyTutorAvg(null);
      setMyTutorCount(0);
    } finally {
      setMyTutorLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (lists.length) fetchTutorAveragesForListings(lists);
  }, [lists.length]); 

  // Sessions
  const fetchSessionList = async (path, setter) => {
    try {
      const res = await api(path);
      const data = await res.json();
      setter(res.ok && Array.isArray(data.requests) ? data.requests : []);
    } catch (e) {
      console.error(e);
      setter([]);
    }
  };

  const refreshSessions = async () => {
    if (!user?._id) return;
    try {
      setSessionsLoading(true);
      await Promise.all([
        fetchSessionList(`/sessionrequests/inbox/${user._id}?userId=${user._id}`, setInboxRequests),
        fetchSessionList(`/sessionrequests/outbox/${user._id}?userId=${user._id}`, setOutboxRequests),
      ]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const refreshRatings = async () => {
    if (!user?._id) return;
    try {
      const res = await api(`/ratings/learner/${user._id}?userId=${user._id}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.ratings)) return;

      const map = {};
      data.ratings.forEach((rt) => {
        const sid = rt?.sessionRequestId?._id || rt?.sessionRequestId;
        if (sid && rt?.score) map[String(sid)] = rt.score;
      });

      setRatingsMap((p) => ({ ...p, ...map }));
    } catch (e) {
      console.error(e);
    }
  };

  // tab entry behaviours
  useEffect(() => {
    if (activeTab === "sessions") {
      setSessionsTab("inbox");
      setStatusFilter("All");
      refreshSessions();
    }

    if (activeTab === "history") {
      refreshSessions();
      refreshRatings();
    }

    if (activeTab === "dashboard") {
      setOwnershipFilter("all");
      setMinRating("all");
    }

    if (activeTab === "profile") {
      fetchMyTutorAverage();
    }
  }, [activeTab]);

  // merge any rating embedded in sessions onto ratingsMap
  useEffect(() => {
    const map = {};
    [...inboxRequests, ...outboxRequests].forEach((r) => {
      const sid = r?._id;
      const sc = r?.rating?.score;
      if (sid && sc) map[String(sid)] = sc;
    });
    if (Object.keys(map).length) setRatingsMap((p) => ({ ...p, ...map }));
  }, [inboxRequests.length, outboxRequests.length]);

  //Listings crud
  const resetForm = () => {
    setSubject("");
    setDescription("");
    setAvailability("");
    setEditingId(null);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!subject || !description || !availability) return alert("Please fill in all fields.");
    if (!user?._id) return (alert("Please login again."), navigate("/"));

    try {
      const isEdit = !!editingId;
      const res = await api(isEdit ? `/tutorlists/${editingId}` : "/tutorlists", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { subject, description, availability } : { tutorId: user._id, subject, description, availability }
        ),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.message || (isEdit ? "Update failed" : "Create failed"));

      resetForm();
      await fetchLists();
    } catch (e) {
      console.error(e);
      alert(editingId ? "Update failed" : "Create failed (check backend is running).");
    }
  };

  const handleStartEdit = (l) => {
    if (idStr(l?.tutorId) !== idStr(user?._id)) return alert("You can only edit your own listing.");
    setEditingId(l._id);
    setSubject(l.subject || "");
    setDescription(l.description || "");
    setAvailability(l.availability || "");
    setActiveTab("dashboard");
  };

  const handleDelete = async (id, tutorIdRaw) => {
    if (idStr(tutorIdRaw) !== idStr(user?._id)) return alert("You can only delete your own listing.");
    if (!window.confirm("Are you sure you want to delete this tutor listing? This action cannot be undone.")) return;

    try {
      const res = await api(`/tutorlists/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.message || "Delete failed");

      if (editingId === id) resetForm();
      await fetchLists();
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  // Requests
  const handleRequestTutor = async (l) => {
    if (!user?._id) return (alert("Please login again."), navigate("/"));
    const tutorId = idStr(l?.tutorId);
    if (tutorId === idStr(user._id)) return alert("You cannot request your own listing.");

    try {
      const res = await api("/sessionrequests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, listingId: l._id, sessionTime: l.availability || "" }),
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();

      if (!res.ok) return alert((data && data.message) || "Request failed");

      alert("✅ Request sent!");
      refreshSessions();
    } catch (e) {
      console.error(e);
      alert("Request failed");
    }
  };

  const handleUpdateRequestStatus = async (id, status) => {
    if (!user?._id) return;
    try {
      const res = await api(`/sessionrequests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, status }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.message || "Update failed");

      refreshSessions();
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  };

  const handleDeleteSessionRequest = async (id) => {
    if (!user?._id) return;
    try {
      const res = await api(`/sessionrequests/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.message || "Delete failed");

      refreshSessions();
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  // Ratings
  const submitRating = async (sessionRequestId, score) => {
    if (!user?._id) return;

    // UI hard lock
    if (ratingsMap[String(sessionRequestId)]) return;

    try {
      setRatingBusyId(sessionRequestId);

      const res = await api("/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, sessionRequestId, score }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.message || "Rating failed");

      setRatingsMap((p) => ({ ...p, [String(sessionRequestId)]: score }));
      
      fetchLists();
    } catch (e) {
      console.error(e);
      alert("Rating failed");
    } finally {
      setRatingBusyId("");
    }
  };

  // tutor modal average
  const fetchTutorAvg = async (tutorId) => {
    try {
      setTutorLoading(true);
      const res = await api(`/ratings/tutor/${tutorId}`);
      const data = await res.json();
      if (!res.ok) return (setTutorAvg(null), setTutorRatingsCount(0));
      setTutorAvg(data?.average ?? null);
      setTutorRatingsCount(data?.count ?? 0);
    } catch (e) {
      setTutorAvg(null);
      setTutorRatingsCount(0);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleViewTutor = async (l) => {
    const t = typeof l?.tutorId === "object" ? l?.tutorId : null;
    if (!t?._id) return alert("Tutor profile not available.");
    setViewingTutor(t);
    setTutorAvg(null);
    setTutorRatingsCount(0);
    await fetchTutorAvg(t._id);
  };

  // Profile
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((p) => ({ ...p, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user?._id) return (alert("Please login again."), navigate("/"));
    if (!profileForm.fullName || !profileForm.email || !profileForm.course || !profileForm.description) {
      return alert("Please fill in all fields (password optional).");
    }

    if (profileForm.password || profileForm.confirmPassword) {
      if (!profileForm.password || !profileForm.confirmPassword) return setProfileMsg("Please fill both password fields.");
      if (profileForm.password !== profileForm.confirmPassword) return setProfileMsg("Passwords do not match.");
      if (profileForm.password.length < 6) return setProfileMsg("Password must be at least 6 characters.");
    }

    try {
      setProfileSaving(true);
      setProfileMsg("");

      const res = await api(`/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          fullName: profileForm.fullName,
          email: profileForm.email,
          course: profileForm.course,
          description: profileForm.description,
          password: profileForm.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) return setProfileMsg(data?.message || "Failed to update profile");

      const updated = data?.user || data;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setProfileMsg("✅ Profile updated!");
      setProfileEditing(false);
      setProfileForm((p) => ({ ...p, password: "", confirmPassword: "" }));
    } catch (e) {
      console.error(e);
      setProfileMsg("Server error updating profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user?._id) return (alert("Please login again."), navigate("/"));
    if (!window.confirm("Are you sure you want to delete your profile? This action cannot be undone.")) return;

    try {
      setProfileSaving(true);
      setProfileMsg("");

      const res = await api(`/users/${user._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await res.json();
      if (!res.ok) return setProfileMsg(data?.message || "Failed to delete profile");

      localStorage.clear();
      navigate("/");
    } catch (e) {
      console.error(e);
      setProfileMsg("Server error deleting profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // Prepare filtered views of existing data for display (sessions, history, listings)
  const sessionList = useMemo(() => (sessionsTab === "inbox" ? inboxRequests : outboxRequests), [
    sessionsTab,
    inboxRequests,
    outboxRequests,
  ]);

  const sessionFiltered = useMemo(
    () => (statusFilter === "All" ? sessionList : sessionList.filter((r) => r.status === statusFilter)),
    [statusFilter, sessionList]
  );

  const history = useMemo(
    () => [...inboxRequests, ...outboxRequests].filter((r) => r.status === "Completed"),
    [inboxRequests, outboxRequests]
  );

  const filteredListings = useMemo(() => {
    const mineId = idStr(user?._id);

    const passOwnership = (l) => {
      const isMine = idStr(l?.tutorId) === mineId;
      if (ownershipFilter === "mine") return isMine;
      if (ownershipFilter === "others") return !isMine;
      return true;
    };

    const passRating = (l) => {
      if (minRating === "all") return true;

      const tid = idStr(l?.tutorId);
      const avg = Number(tutorAvgMap?.[tid]?.average || 0);
      const count = Number(tutorAvgMap?.[tid]?.count || 0);

      if (minRating === "none") return count === 0;

      const threshold = Number(minRating);
      return count > 0 && avg >= threshold;
    };

    return (lists || []).filter((l) => passOwnership(l) && passRating(l));
  }, [lists, ownershipFilter, minRating, tutorAvgMap, user?._id]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.avatar}>{user?.fullName?.[0] || "U"}</div>
            <div>
              <div className={styles.brandTitle}>TutorMatch</div>
              <div className={styles.brandSub}>Welcome {user?.fullName || "User"}</div>
            </div>
          </div>

          <div className={styles.tabs}>
            <TabButton id="dashboard" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="sessions" label="Sessions" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="history" label="History" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="profile" label="Profile" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className={styles.btnGhost}
          >
            Logout
          </button>
        </div>

        {/* Render selected tab and pass required props (state + handlers) to each view */}

        {activeTab === "dashboard" && (
          <DashboardView
            editingId={editingId}
            subject={subject}
            setSubject={setSubject}
            description={description}
            setDescription={setDescription}
            availability={availability}
            setAvailability={setAvailability}
            handleCreateOrUpdate={handleCreateOrUpdate}
            resetForm={resetForm}
            loading={loading}
            filteredListings={filteredListings}
            user={user}
            ownershipFilter={ownershipFilter}
            setOwnershipFilter={setOwnershipFilter}
            minRating={minRating}
            setMinRating={setMinRating}
            tutorAvgMap={tutorAvgMap}
            handleStartEdit={handleStartEdit}
            handleDelete={handleDelete}
            handleViewTutor={handleViewTutor}
            handleRequestTutor={handleRequestTutor}
            idStr={idStr}
            viewingTutor={viewingTutor}
            setViewingTutor={setViewingTutor}
            tutorLoading={tutorLoading}
            tutorAvg={tutorAvg}
            tutorRatingsCount={tutorRatingsCount}
          />
        )}

        {activeTab === "sessions" && (
          <SessionsView
            sessionsTab={sessionsTab}
            setSessionsTab={setSessionsTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sessionsLoading={sessionsLoading}
            sessionFiltered={sessionFiltered}
            handleUpdateRequestStatus={handleUpdateRequestStatus}
            handleDeleteSessionRequest={handleDeleteSessionRequest}
          />
        )}

        {activeTab === "history" && (
          <HistoryView
            sessionsLoading={sessionsLoading}
            history={history}
            user={user}
            ratingsMap={ratingsMap}
            ratingBusyId={ratingBusyId}
            submitRating={submitRating}
            idStr={idStr}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView
            user={user}
            profileEditing={profileEditing}
            setProfileEditing={setProfileEditing}
            profileMsg={profileMsg}
            setProfileMsg={setProfileMsg}
            profileSaving={profileSaving}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            handleProfileChange={handleProfileChange}
            handleSaveProfile={handleSaveProfile}
            handleDeleteProfile={handleDeleteProfile}
            myTutorLoading={myTutorLoading}
            myTutorAvg={myTutorAvg}
            myTutorCount={myTutorCount}
          />
        )}
      </div>
    </div>
  );
}
