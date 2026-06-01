import { useState } from "react"
import Login from "./Login"
import Dashboard from "./Dashboard"


export default function App() {
  const [token, setToken] = useState("")

  return token
    ? <Dashboard token={token} logout={() => setToken("")} />
    : <Login setToken={setToken} />
}