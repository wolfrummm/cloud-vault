import { useEffect, useState } from "react"
import axios from "axios"

export default function Versioning({ token, API, files }) {
  const [selected, setSelected]   = useState("")
  const [versions, setVersions]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")

  const headers = { Authorization: token }

  const uniqueFilenames = [...new Set((files || []).map(f => f.filename))].sort()
  const loadVersions = async (filename) => {
    if (!filename) return
    setLoading(true)
    setError("")
    setVersions([])
    try {
      const res = await axios.get(`${API}/api/files/versions/${encodeURIComponent(filename)}`, { headers })
      setVersions(res.data)
    } catch (err) {
      setError(err.response?.data || "Could not load versions")
    } finally {
      setLoading(false)
    }
  }

  const download = async (id, filename) => {
    try {
      const response = await axios.get(`${API}/api/files/download/${id}`, {
        headers, responseType: "blob"
      })
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href  = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch { alert("Download failed") }
  }

  useEffect(() => {
    if (uniqueFilenames.length > 0 && !selected) {
      setSelected(uniqueFilenames[0])
      loadVersions(uniqueFilenames[0])
    }
  }, [files])

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Versioning</h1>
          <p>Browse and restore historical file versions stored in S3.</p>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-card">
          <div className="metric-label">Total versions</div>
          <div className="metric-val">{files.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Unique files</div>
          <div className="metric-val">{uniqueFilenames.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Versions for selected</div>
          <div className="metric-val">{versions.length}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>Select file:</label>
        <select
          value={selected}
          onChange={e => { setSelected(e.target.value); loadVersions(e.target.value) }}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", cursor: "pointer", minWidth: 220 }}
        >
          <option value="">— choose a file —</option>
          {uniqueFilenames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        {selected && (
          <button onClick={() => loadVersions(selected)} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 13 }}>
            Refresh
          </button>
        )}
      </div>

      {loading && <p style={{ color: "#64748b" }}>Loading versions…</p>}
      {error   && <p style={{ color: "#dc2626" }}>{error}</p>}

      {!loading && versions.length > 0 && (
        <div className="table">
          <div className="table-header" style={{ gridTemplateColumns: "2fr 1fr 3fr 2fr 1.5fr" }}>
            <span>Filename</span>
            <span>Version</span>
            <span>S3 Key</span>
            <span>Uploaded</span>
            <span>Action</span>
          </div>
          {versions.map(v => (
            <div className="row" key={v._id} style={{ gridTemplateColumns: "2fr 1fr 3fr 2fr 1.5fr" }}>
              <span style={{ fontWeight: 500 }}>{v.filename}</span>
              <span>
                <span className="badge" style={{ background: "#ede9fe", color: "#6d28d9", fontFamily: "monospace" }}>v{v.version}</span>
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.s3Key}
              </span>
              <span style={{ color: "#64748b", fontSize: 13 }}>{new Date(v.uploadedAt).toLocaleString()}</span>
              <div className="actions">
                <button onClick={() => download(v._id, v.filename)} style={{ fontSize: 12, padding: "5px 10px" }}>
                  Download v{v.version}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && selected && versions.length === 0 && (
        <p style={{ color: "#94a3b8", marginTop: 12 }}>No versions found for this file.</p>
      )}
      {!selected && !loading && (
        <p style={{ color: "#94a3b8", marginTop: 12 }}>Select a file above to see its version history.</p>
      )}

      <div className="info-card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 12, fontSize: 15 }}>Versioning policy</h3>
        {[
          ["Auto-version on every upload",  "Sequential v1, v2, v3… stored as distinct S3 objects with unique keys"],
          ["Immutable version history",      "Uploading a new version never overwrites the previous one"],
          ["Per-user isolation",             "Version counts are scoped to each user — no cross-user collisions"],
          ["Full version retrieval",         "Any historical version downloadable via GET /api/files/download/:id"]
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
