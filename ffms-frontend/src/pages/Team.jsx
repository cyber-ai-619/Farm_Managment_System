import { useState, useEffect, useCallback } from "react";
import teamService from "../services/teamService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

const ROLE_OPTIONS = [
  { id: 3, name: "farm_manager", label: "Farm Manager", desc: "Full operational management, shift scheduling, and field activities." },
  { id: 4, name: "agronomist", label: "Agronomist", desc: "Crop scouting, pest & disease reports, soil and harvest recommendations." },
  { id: 7, name: "veterinarian", label: "Veterinarian", desc: "Livestock health records, vaccinations, treatments, and breeding oversight." },
  { id: 6, name: "accountant", label: "Accountant / Auditor", desc: "Financial ledgers, sales orders, purchase orders, and budgets." },
  { id: 5, name: "worker", label: "Field Worker / Operator", desc: "Daily task execution, equipment operation, and attendance logging." },
];

function Team() {
  const { role, user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");

  // Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role_id: 3,
    mode: "invite", // 'invite' | 'direct'
    password: "",
  });

  // Fetch Farms
  useEffect(() => {
    async function loadFarms() {
      try {
        const farmList = await farmService.getFarms();
        setFarms(farmList);
        if (farmList.length > 0) {
          setSelectedFarmId(farmList[0].id);
        }
      } catch (err) {
        setError(err.message || "Failed to load farms.");
      }
    }
    loadFarms();
  }, []);

  // Fetch Members
  const fetchMembers = useCallback(async () => {
    if (!selectedFarmId) return;
    try {
      setLoading(true);
      setError("");
      const data = await teamService.getMembers(selectedFarmId);
      setMembers(data);
    } catch (err) {
      setError(err.message || "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarmId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;

    if (inviteForm.mode === "direct" && (inviteForm.password.length < 8 || inviteForm.password.length > 72)) {
      alert("Temporary password must be between 8 and 72 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await teamService.inviteOrAddMember(selectedFarmId, {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        role_id: Number(inviteForm.role_id),
        mode: inviteForm.mode,
        password: inviteForm.password,
      });

      if (res.invite_token) {
        const inviteUrl = `${window.location.origin}/register?invite=${res.invite_token}&email=${encodeURIComponent(inviteForm.email.trim())}`;
        setGeneratedInviteLink(inviteUrl);
      } else {
        setSuccessMessage("Member added successfully!");
        setIsInviteModalOpen(false);
        resetForm();
      }
      await fetchMembers();
    } catch (err) {
      setError(err.message || "Failed to invite member.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setInviteForm({
      name: "",
      email: "",
      role_id: 3,
      mode: "invite",
      password: "",
    });
    setGeneratedInviteLink("");
  };

  const handleToggleStatus = async (member) => {
    const nextStatus = member.status === "active" ? "suspended" : "active";
    const confirmMsg = member.status === "active"
      ? `Are you sure you want to suspend ${member.name}? They will lose system access immediately.`
      : `Reactivate access for ${member.name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await teamService.updateMember(selectedFarmId, member.id, { status: nextStatus });
      await fetchMembers();
    } catch (err) {
      alert(err.message || "Failed to update member status.");
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} from the farm team?`)) return;

    try {
      await teamService.removeMember(selectedFarmId, member.id);
      await fetchMembers();
    } catch (err) {
      alert(err.message || "Failed to remove member.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Invite link copied to clipboard!");
  };

  const activeMembersCount = members.filter((m) => m.status === "active").length;
  const pendingInvitesCount = members.filter((m) => m.status === "invited").length;

  const currentFarm = farms.find((f) => Number(f.id) === Number(selectedFarmId));
  const canManage = ["admin", "farm_owner"].includes(role);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(26px, 3vw, 36px)", color: "#122e20" }}>
            Farm Team & Permissions
          </h1>
          <p style={{ margin: "6px 0 0", color: "rgba(43, 38, 34, 0.75)", fontSize: "15px" }}>
            Manage staff accounts, assign operational roles, and issue team invites for your farm.
          </p>
        </div>

        {canManage && (
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {farms.length > 1 && (
              <select
                value={selectedFarmId || ""}
                onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(212, 165, 74, 0.4)",
                  backgroundColor: "#FFF",
                  color: "#1E4632",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                resetForm();
                setIsInviteModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: "#1E4632",
                color: "#F5EAD0",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <span>+</span> Invite / Add Member
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}
      {successMessage && (
        <div style={{ padding: "12px 16px", backgroundColor: "#E8F5E9", color: "#2E7D32", borderRadius: "8px", marginBottom: "20px" }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="content-card" style={{ padding: "18px 20px", background: "rgba(255, 253, 248, 0.9)" }}>
          <div style={{ color: "rgba(43, 38, 34, 0.55)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Selected Farm</div>
          <strong style={{ display: "block", marginTop: "6px", fontSize: "20px", color: "#1E4632" }}>
            {currentFarm?.name || "Loading farm..."}
          </strong>
          <span style={{ fontSize: "12px", color: "rgba(43, 38, 34, 0.6)" }}>{currentFarm?.location || "Primary Workspace"}</span>
        </div>

        <div className="content-card" style={{ padding: "18px 20px", background: "rgba(255, 253, 248, 0.9)" }}>
          <div style={{ color: "rgba(43, 38, 34, 0.55)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Active Staff</div>
          <strong style={{ display: "block", marginTop: "6px", fontSize: "26px", color: "#2E7D32" }}>
            {activeMembersCount}
          </strong>
          <span style={{ fontSize: "12px", color: "rgba(43, 38, 34, 0.6)" }}>Authorized system users</span>
        </div>

        <div className="content-card" style={{ padding: "18px 20px", background: "rgba(255, 253, 248, 0.9)" }}>
          <div style={{ color: "rgba(43, 38, 34, 0.55)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Pending Invites</div>
          <strong style={{ display: "block", marginTop: "6px", fontSize: "26px", color: "#D4A54A" }}>
            {pendingInvitesCount}
          </strong>
          <span style={{ fontSize: "12px", color: "rgba(43, 38, 34, 0.6)" }}>Awaiting member activation</span>
        </div>
      </div>

      {/* Team Table */}
      <div className="content-card" style={{ padding: "20px", background: "#FFF", borderRadius: "12px", overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: "#1E4632", fontSize: "18px" }}>Team Members ({members.length})</h3>
        </div>

        {loading ? (
          <Loading message="Loading team members..." />
        ) : members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(43, 38, 34, 0.6)" }}>
            <p style={{ fontSize: "16px", margin: "0 0 12px" }}>No staff members added to this farm yet.</p>
            {canManage && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsInviteModalOpen(true)}
                style={{ padding: "8px 16px", borderRadius: "6px", background: "#1E4632", color: "#FFF", border: "none", cursor: "pointer" }}
              >
                + Invite Your First Team Member
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(30, 70, 50, 0.1)", color: "#1E4632", fontSize: "13px" }}>
                <th style={{ padding: "12px 14px" }}>Member</th>
                <th style={{ padding: "12px 14px" }}>Email</th>
                <th style={{ padding: "12px 14px" }}>Role</th>
                <th style={{ padding: "12px 14px" }}>Status</th>
                <th style={{ padding: "12px 14px" }}>Joined / Invited</th>
                {canManage && <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isOwner = member.role_name === "farm_owner" || Number(member.user_id) === Number(currentFarm?.owner_id);
                return (
                  <tr key={member.id} style={{ borderBottom: "1px solid rgba(30, 70, 50, 0.07)", fontSize: "14px" }}>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: isOwner ? "#1E4632" : "#D4A54A",
                            color: "#FFF",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <strong style={{ color: "#122e20", display: "block" }}>{member.name}</strong>
                          {Number(member.user_id) === Number(user?.id) && (
                            <span style={{ fontSize: "11px", color: "#3f7d3a", fontWeight: 700 }}>(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px", color: "rgba(43, 38, 34, 0.8)" }}>{member.email}</td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          backgroundColor: isOwner ? "rgba(30, 70, 50, 0.12)" : "rgba(212, 165, 74, 0.15)",
                          color: isOwner ? "#1E4632" : "#8A6517",
                          textTransform: "capitalize",
                        }}
                      >
                        {String(member.role_name || "Staff").replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          backgroundColor:
                            member.status === "active" ? "#E8F5E9" : member.status === "invited" ? "#FFF8E1" : "#FFEBEE",
                          color:
                            member.status === "active" ? "#2E7D32" : member.status === "invited" ? "#B78103" : "#C62828",
                        }}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px", color: "rgba(43, 38, 34, 0.6)", fontSize: "13px" }}>
                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : "Recently"}
                    </td>
                    {canManage && (
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        {isOwner ? (
                          <span style={{ color: "#888", fontSize: "12px", fontStyle: "italic" }}>Primary Owner</span>
                        ) : (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            {member.status === "invited" && member.invite_token && (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/register?invite=${member.invite_token}&email=${encodeURIComponent(member.email)}`;
                                  copyToClipboard(url);
                                }}
                                style={{
                                  background: "none",
                                  border: "1px solid #D4A54A",
                                  color: "#8A6517",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                                title="Copy invitation link"
                              >
                                🔗 Copy Link
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(member)}
                              style={{
                                background: "none",
                                border: "1px solid #CCC",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer",
                                color: member.status === "active" ? "#C0392B" : "#2E7D32",
                              }}
                            >
                              {member.status === "active" ? "Suspend" : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              style={{
                                background: "none",
                                border: "1px solid #E74C3C30",
                                color: "#C0392B",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Invite / Add Team Member */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          resetForm();
        }}
        title="Invite / Add Team Member"
        maxWidth="560px"
      >
        {generatedInviteLink ? (
          <div>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📬</div>
              <h3 style={{ margin: 0, color: "#1E4632" }}>Invitation Dispatched!</h3>
              <p style={{ color: "rgba(43, 38, 34, 0.8)", margin: "8px 0 16px" }}>
                An invitation email has been sent to <strong>{inviteForm.email}</strong>. You can also copy and share this link directly with <strong>{inviteForm.name}</strong>:
              </p>
              <div
                style={{
                  padding: "10px 12px",
                  background: "#F5F5F5",
                  border: "1px solid #DDD",
                  borderRadius: "6px",
                  wordBreak: "break-all",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  textAlign: "left",
                  marginBottom: "16px",
                }}
              >
                {generatedInviteLink}
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => copyToClipboard(generatedInviteLink)}
                style={{
                  padding: "10px 20px",
                  background: "#1E4632",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📋 Copy Invitation Link
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  resetForm();
                }}
                style={{ padding: "8px 16px", border: "1px solid #CCC", background: "#FFF", borderRadius: "6px", cursor: "pointer" }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit}>
            <div className="form-field" style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px" }}>Full Name *</label>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="e.g. John Mwansa"
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>

            <div className="form-field" style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px" }}>Email Address *</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="e.g. jmwansa@agricorp.com"
                required
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CCC" }}
              />
            </div>

            <div className="form-field" style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px" }}>Role & Permissions *</label>
              <select
                value={inviteForm.role_id}
                onChange={(e) => setInviteForm({ ...inviteForm, role_id: Number(e.target.value) })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CCC", backgroundColor: "#FFF" }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <small style={{ display: "block", marginTop: "4px", color: "rgba(43, 38, 34, 0.6)", fontSize: "12px" }}>
                {ROLE_OPTIONS.find((r) => r.id === inviteForm.role_id)?.desc}
              </small>
            </div>

            <div className="form-field" style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px" }}>Provisioning Method</label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                  <input
                    type="radio"
                    name="mode"
                    value="invite"
                    checked={inviteForm.mode === "invite"}
                    onChange={() => setInviteForm({ ...inviteForm, mode: "invite" })}
                  />
                  Generate Invitation Link
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "14px" }}>
                  <input
                    type="radio"
                    name="mode"
                    value="direct"
                    checked={inviteForm.mode === "direct"}
                    onChange={() => setInviteForm({ ...inviteForm, mode: "direct" })}
                  />
                  Set Temporary Password Directly
                </label>
              </div>
            </div>

            {inviteForm.mode === "direct" && (
              <div className="form-field" style={{ marginBottom: "16px", padding: "12px", background: "#FDF8ED", borderRadius: "6px", border: "1px solid #E6D2B5" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px" }}>
                  Temporary Password (8-72 characters) *
                </label>
                <input
                  type="password"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  placeholder="Set initial password for member"
                  minLength={8}
                  maxLength={72}
                  required={inviteForm.mode === "direct"}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #CCC" }}
                />
                <small style={{ display: "block", marginTop: "4px", color: "#8A6517", fontSize: "12px" }}>
                  Provide this password to the field worker so they can log in immediately.
                </small>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsInviteModalOpen(false)}
                disabled={submitting}
                style={{ padding: "9px 16px", borderRadius: "6px", border: "1px solid #CCC", background: "#FFF", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{
                  padding: "9px 20px",
                  borderRadius: "6px",
                  background: "#1E4632",
                  color: "#F5EAD0",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {submitting ? "Processing..." : inviteForm.mode === "invite" ? "Generate Invite" : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Team;
