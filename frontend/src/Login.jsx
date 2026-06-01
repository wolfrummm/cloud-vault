import { useState } from "react"
import axios from "axios"
import "./styles.css"

const API = "https://secure-vault-production-1159.up.railway.app"

export default function Login({ setToken }) {

  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const login = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password })
      setToken(res.data.token)
    } catch {
      alert("Invalid credentials")
    }
  }

  const signup = async () => {
    try {
      await axios.post(`${API}/api/auth/signup`, { email, password })
      alert("Account created successfully. Please login.")
      setIsSignup(false)
    } catch (err) {
      alert(err.response?.data || "Signup failed")
    }
  }

  return (
    <div className="layout">

      {/* LEFT PANEL */}
      <div className="left">

        <div className="brand">
          <div className="logo">☁️</div>
          <span>CloudVault</span>
        </div>

        <h1>
          Secure Cloud Storage <br />
          with <span className="highlight">Identity Access Management</span>
        </h1>

        <p className="subtitle">
          Upload, version, and replicate your files with enterprise-grade security.
          JWT-authenticated access keeps your data safe.
        </p>

        <ul className="features">
          <li>End-to-end encrypted storage</li>
          <li>File versioning & rollback</li>
          <li>Backup & replication</li>
          <li>Secure API access</li>
        </ul>

        <div className="footer">© 2026 CloudVault</div>

      </div>

      {/* RIGHT PANEL */}
      <div className="right">

        <div className="card">

          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p className="form-sub">
            {isSignup
              ? "Sign up to start using secure cloud storage."
              : "Sign in to access your secure cloud storage."}
          </p>

          <label>Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            onChange={e => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
          />

          {isSignup ? (
            <button onClick={signup}>Sign Up</button>
          ) : (
            <button onClick={login}>Sign In</button>
          )}

          <p
            className="signup"
            onClick={() => setIsSignup(!isSignup)}
            style={{ cursor: "pointer" }}
          >
            {isSignup
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </p>

        </div>

      </div>

    </div>
  )
}