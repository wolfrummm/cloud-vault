const router = require("express").Router()
const User   = require("../models/user")
const File   = require("../models/File")
const auth   = require("../middleware/auth")

const requireAdmin = async (req, res) => {
  const me = await User.findById(req.user.id)
  if (!me || me.role !== "admin") {
    res.status(403).json({ error: "Admin access required" })
    return null
  }
  return me
}

// GET all users — admin only
router.get("/users", auth, async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return
    const users = await User.find({}, "-password").sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// PATCH role — admin only
router.patch("/users/:id/role", auth, async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return
    const allowed = ["admin", "manager", "user", "viewer"]
    if (!allowed.includes(req.body.role))
      return res.status(400).json({ error: "Invalid role" })
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, select: "-password" }
    )
    if (!updated) return res.status(404).json({ error: "User not found" })
    res.json(updated)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// DELETE user — admin only
router.delete("/users/:id", auth, async (req, res) => {
  try {
    if (!await requireAdmin(req, res)) return
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: "Cannot delete your own account" })
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User removed successfully" })
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// GET replication log
router.get("/replication-log", auth, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id })
      .sort({ uploadedAt: -1 })
      .select("filename version s3Key isReplicated uploadedAt mimeType")
    res.json(files)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// GET stats summary
router.get("/stats", auth, async (req, res) => {
  try {
    const [uniqueFiles, totalVersions, replicated] = await Promise.all([
      File.distinct("filename", { userId: req.user.id }),
      File.countDocuments({ userId: req.user.id }),
      File.countDocuments({ userId: req.user.id, isReplicated: true })
    ])
    res.json({
      uniqueFiles:    uniqueFiles.length,
      totalVersions,
      replicated,
      replicationRate: totalVersions ? Math.round((replicated / totalVersions) * 100) : 0
    })
  } catch (err) {
    res.status(500).send(err.message)
  }
})

module.exports = router
