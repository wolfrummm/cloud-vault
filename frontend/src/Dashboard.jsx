import { useEffect, useState } from "react"
import axios from "axios"
import "./dashboard.css"
import AccessControl from "./panels/AccessControl"
import Versioning from "./panels/Versioning"
import Backup from "./panels/Backup"

const API = "https://secure-vault-production-1159.up.railway.app"

export default function Dashboard({ token, logout }) {
  const [tab, setTab]     = useState("files")
  const [files, setFiles] = useState([])

  const loadFiles = async () => {
    try {
      const res = await axios.get(`${API}/api/files/list`, {
        headers: { Authorization: token }
      })
      setFiles(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    try {
      const form = new FormData()
      form.append("file", selectedFile)
      await axios.post(`${API}/api/files/upload`, form, {
        headers: { Authorization: token }
      })
      loadFiles()
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    }
  }

  const download = async (id, filename) => {
    try {
      const response = await axios.get(`${API}/api/files/download/${id}`, {
        headers: { Authorization: token },
        responseType: "blob"
      })
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href  = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error(err)
      alert("Download failed")
    }
  }

  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file?")) return
    try {
      await axios.delete(`${API}/api/files/delete/${id}`, {
        headers: { Authorization: token }
      })
      loadFiles()
    } catch (err) {
      console.error(err)
      alert("Delete failed")
    }
  }

  const formatType = (type) => {
    if (!type) return "FILE"
    if (type.includes("pdf"))   return "PDF"
    if (type.includes("image")) return "IMAGE"
    if (type.includes("word"))  return "DOC"
    if (type.includes("excel")) return "XLS"
    if (type.includes("text"))  return "TXT"
    return type.split("/")[1]?.toUpperCase() || "FILE"
  }

  useEffect(() => { loadFiles() }, [])

  const navItems = [
    { key: "files",      label: "File Manager"    },
    { key: "access",     label: "Access Control"  },
    { key: "versioning", label: "Versioning"       },
    { key: "backup",     label: "Backup"           }
  ]

  return (
    <div className="dash-layout">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>☁ CloudVault</h2>
        <nav>
          {navItems.map(item => (
            <p
              key={item.key}
              className={tab === item.key ? "active" : ""}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </p>
          ))}
        </nav>
        <button className="logout" onClick={logout}>Logout</button>
      </div>

      {/* MAIN */}
      <div className="main">

        {/* ── File Manager ── */}
        {tab === "files" && (
          <>
            <div className="topbar">
              <div>
                <h1>File Manager</h1>
                <p>Upload, download, and manage your files securely.</p>
              </div>
              <div className="upload">
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
                <button onClick={() => document.getElementById("fileInput").click()}>
                  Upload File
                </button>
              </div>
            </div>

            <div className="table">
              <div className="table-header">
                <span>Name</span>
                <span>Version</span>
                <span>Uploaded</span>
                <span>Action</span>
              </div>

              {files.length === 0 ? (
                <div className="row">
                  <span style={{ color: "#94a3b8" }}>No files uploaded yet</span>
                  <span>–</span><span>–</span><span>–</span>
                </div>
              ) : (
                files.map(file => (
                  <div key={file._id} className="row">
                    <span className="type-badge">{formatType(file.mimeType)}</span>
                    <span className="badge">v{file.version}</span>
                    <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                    <div className="actions">
                      <button onClick={() => download(file._id, file.filename)}>Download</button>
                      <button className="delete-btn" onClick={() => deleteFile(file._id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === "access"     && <AccessControl token={token} API={API} />}
        {tab === "versioning" && <Versioning token={token} API={API} files={files} />}
        {tab === "backup"     && <Backup token={token} API={API} />}

      </div>
    </div>
  )
}
