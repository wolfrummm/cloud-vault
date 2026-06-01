import { useEffect, useState } from "react"
import axios from "axios"

export default function Backup({ token, API }) {
  const [log, setLog] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const headers = { Authorization: token }

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [logRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/admin/replication-log`, { headers }),
        axios.get(`${API}/api/admin/stats`, { headers })
      ])
      setLog(Array.isArray(logRes.data) ? logRes.data : [])
      setStats(statsRes.data)
    } catch (err) {
      setError(err.response?.data || "Could not load backup data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const safeLog = Array.isArray(log) ? log : []
  const successCount = safeLog.filter(f => f.isReplicated).length
  const failCount = safeLog.length - successCount
  const rate = safeLog.length ? Math.round((successCount / safeLog.length) * 100) : 0

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Backup &amp; Replication</h1>
          <p>Cross-region S3 replication status and lifecycle overview.</p>
        </div>
        <button onClick={loadData} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-label">Replication rate</div>
          <div className="metric-val" style={{ color: rate === 100 ? "#065f46" : "#b45309" }}>
            {loading ? "…" : `${rate}%`}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Replicated objects</div>
          <div className="metric-val">{loading ? "…" : successCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Failed replications</div>
          <div className="metric-val" style={{ color: failCount > 0 ? "#dc2626" : "#065f46" }}>
            {loading ? "…" : failCount}
          </div>
        </div>
      </div>

      {/* Bucket status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          {
            name: "cloud-storage-primary",
            region: "us-east-1", label: "Primary",
            labelStyle: { background: "#d1fae5", color: "#065f46" },
            objects: stats?.totalVersions ?? "…", fill: "#2563eb", width: "50%"
          },
          {
            name: "cloud-storage-backup",
            region: "us-west-2", label: "Secondary (CRR)",
            labelStyle: { background: "#dbeafe", color: "#1e40af" },
            objects: successCount, fill: "#16a34a", width: rate + "%"
          }
        ].map(bucket => (
          <div className="info-card" key={bucket.name} style={{ marginTop: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{bucket.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{bucket.region}</div>
              </div>
              <span className="badge" style={bucket.labelStyle}>{bucket.label}</span>
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>{bucket.objects} objects · Public access: blocked</div>
            <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: loading ? "0%" : bucket.width, background: bucket.fill, borderRadius: 3, transition: "width 0.5s" }} />
            </div>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: "#64748b" }}>Loading replication log…</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Replication log
          </h3>
          <div className="table">
            <div className="table-header" style={{ gridTemplateColumns: "2fr 1fr 3fr 2fr 1.5fr" }}>
              <span>Filename</span>
              <span>Version</span>
              <span>S3 Key</span>
              <span>Uploaded</span>
              <span>Status</span>
            </div>
            {log.length === 0 ? (
              <div className="row" style={{ gridTemplateColumns: "2fr 1fr 3fr 2fr 1.5fr" }}>
                <span style={{ color: "#94a3b8" }}>No files found</span>
                <span /><span /><span /><span />
              </div>
            ) : (
              log.map(f => (
                <div className="row" key={f._id} style={{ gridTemplateColumns: "2fr 1fr 3fr 2fr 1.5fr" }}>
                  <span style={{ fontWeight: 500 }}>{f.filename}</span>
                  <span>
                    <span className="badge" style={{ background: "#ede9fe", color: "#6d28d9", fontFamily: "monospace" }}>v{f.version}</span>
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.s3Key?.slice(0, 45)}…
                  </span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{new Date(f.uploadedAt).toLocaleString()}</span>
                  <span>
                    {f.isReplicated
                      ? <span className="badge" style={{ background: "#d1fae5", color: "#065f46" }}>Replicated ✓</span>
                      : <span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>Failed ✗</span>
                    }
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className="info-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 12, fontSize: 15 }}>Replication &amp; lifecycle settings</h3>
        {[
          ["Synchronous CRR on every upload", "CopyObject fires immediately after PutObject — no async delay", true],
          ["Replication status tracked in DB", "isReplicated flag stored in MongoDB for audit and debugging", true],
          ["S3 Glacier transition (future)", "Lifecycle policy to move old versions to cold storage after 90 days", false],
          ["Multi-region CRR (future)", "Extend backup to eu-west-1 and ap-south-1 for geo-redundancy", false]
        ].map(([title, desc, active]) => (
          <div key={title} className="policy-row">
            <div>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{desc}</div>
            </div>
            <span className="badge" style={active ? { background: "#d1fae5", color: "#065f46", whiteSpace: "nowrap" } : { background: "#f1f5f9", color: "#64748b", whiteSpace: "nowrap" }}>
              {active ? "Active" : "Planned"}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
