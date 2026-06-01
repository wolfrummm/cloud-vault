require("dotenv").config()
const express = require("express")
const cors    = require("cors")

const app = express()

const connectDB = require("./config/db")
connectDB()

app.use(cors({
  origin: [
    "https://secure-vault-sepia-ten.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}))

app.use(express.json())

app.use("/api/auth",  require("./routes/auth"))
app.use("/api/files", require("./routes/files"))
app.use("/api/admin", require("./routes/admin"))

app.get("/", (req, res) => res.send("API running"))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
