import { useEffect, useState } from "react"
import axios from "axios"

const ROLES = ["viewer", "user", "manager", "admin"]

const roleBadgeStyle = {
  admin:   { background: "#fee2e2", color: "#991b1b" },
  manager: { background: "#dbeafe", color: "#1e40af" },
  user:    { background: "#d1fae5", color: "#065f46" },
  viewer:  { background: "#f1f5f9", color: "#475569" }
}

export default function AccessControl({ token, API }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")

  const headers = { Authorization: token }

  const loadUsers = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await axios.get(`${API}/api/admin/users`, { headers })
      setUsers(res.data)
    } catch (err) {
      setError(err.response?.data?.error || "Could not load users. Admin access required.")
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId, newRole) => {
    try {
      await axios.patch(`${API}/api/admin/users/${userId}/role`, { role: newRole }, { headers })
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
    } catch (err) {
      alert(err.response?.data?.error || "Role update failed")
    }
  }

  const removeUser = async (userId) => {
    if (!window.confirm("Remove this user?")) return
    try {
      await axios.delete(`${API}/api/admin/users/${userId}`, { headers })
      setUsers(prev => prev.filter(u => u._id !== userId))
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed")
    }
  }

  useEffect(() => { loadUsers() }, [])

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Access Control</h1>
          <p>Manage user roles and permissions (admin only).</p>
        </div>
        <button onClick={loadUsers} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-label">Total users</div>
          <div className="metric-val">{users.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Admins</div>
          <div className="metric-val">{users.filter(u => u.role === "admin").length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Regular users</div>
          <div className="metric-val">{users.filter(u => u.role === "user").length}</div>
        </div>
      </div>

      {loading && <p style={{ color: "#64748b", padding: "20px 0" }}>Loading users…</p>}
      {error   && <p style={{ color: "#dc2626", padding: "20px 0" }}>{error}</p>}

      {!loading && !error && (
        <div className="table">
          <div className="table-header" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr" }}>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>
          {users.length === 0 ? (
            <div className="row" style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr" }}>
              <span style={{ color: "#94a3b8" }}>No users found</span>
              <span /><span /><span />
            </div>
          ) : (
            users.map(user => (
              <div className="row" key={user._id} style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1.5fr" }}>
                <span style={{ fontWeight: 500 }}>{user.email}</span>
                <span>
                  <select
                    value={user.role || "user"}
                    onChange={e => updateRole(user._id, e.target.value)}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0",
                      fontSize: 13, cursor: "pointer",
                      background: roleBadgeStyle[user.role]?.background || "#f1f5f9",
                      color:      roleBadgeStyle[user.role]?.color      || "#475569"
                    }}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </span>
                <span style={{ color: "#64748b", fontSize: 13 }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "–"}
                </span>
                <div className="actions">
                  <button className="delete-btn" onClick={() => removeUser(user._id)} style={{ fontSize: 12, padding: "5px 10px" }}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="info-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 12, fontSize: 15 }}>IAM Policy summary</h3>
        {[
          ["JWT required on all routes",      "Unauthenticated requests → 401 Unauthorized"],
          ["Least-privilege S3 access",        "App IAM user has only PutObject, GetObject, CopyObject, DeleteObject"],
          ["Admin-gated user management",      "Only admin role can view/edit/remove users via /api/admin/*"],
          ["Passwords never stored plaintext", "bcrypt hash with 10 salt rounds on every password"]
        ].map(([title, desc]) => (
          <div key={title} className="policy-row">
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{desc}</div>
            </div>
            <span className="badge" style={{ background: "#d1fae5", color: "#065f46", whiteSpace: "nowrap" }}>Active</span>
          </div>
        ))}
      </div>
    </>
  )
}
