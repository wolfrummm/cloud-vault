const {
  PutObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3")
const s3     = require("../config/s3")
const { v4: uuidv4 } = require("uuid")
const File   = require("../models/File")
const auth   = require("../middleware/auth")
const router = require("express").Router()
const multer = require("multer")

const upload = multer({ storage: multer.memoryStorage() })

// ── Upload ────────────────────────────────────────────────────────────────────
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const filename = req.file.originalname
    const userId   = req.user.id

    const existing = await File.find({ filename, userId }).sort({ version: -1 })
    const version  = existing.length > 0 ? existing[0].version + 1 : 1

    const key = `${userId}/${uuidv4()}-${filename}`

    await s3.send(new PutObjectCommand({
      Bucket:      process.env.PRIMARY_BUCKET,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype
    }))

    let isReplicated = false
    try {
      await s3.send(new CopyObjectCommand({
        Bucket:     process.env.BACKUP_BUCKET,
        CopySource: `${process.env.PRIMARY_BUCKET}/${key}`,
        Key:        key
      }))
      isReplicated = true
    } catch (replErr) {
      console.error("Replication failed:", replErr.message)
    }

    const newFile = new File({
      userId,
      filename,
      version,
      s3Key: key,
      mimeType: req.file.mimetype,
      isReplicated
    })
    await newFile.save()

    res.status(201).json({ message: "File uploaded to cloud with replication", version, isReplicated })

  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
})

// ── Download ──────────────────────────────────────────────────────────────────
router.get("/download/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
    if (!file) return res.status(404).send("File not found")

    const response = await s3.send(new GetObjectCommand({
      Bucket: process.env.PRIMARY_BUCKET,
      Key:    file.s3Key
    }))

    res.setHeader("Content-Type", response.ContentType || "application/octet-stream")
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`)
    response.Body.pipe(res)

  } catch (err) {
    console.error("Download error:", err)
    res.status(500).send("Download failed")
  }
})

// ── List all files for user ───────────────────────────────────────────────────
router.get("/list", auth, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id }).sort({ uploadedAt: -1 })
    res.json(files)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// ── Version history for a filename ───────────────────────────────────────────
router.get("/versions/:filename", auth, async (req, res) => {
  try {
    const files = await File.find({
      userId:   req.user.id,
      filename: req.params.filename
    }).sort({ version: 1 })

    if (files.length === 0) return res.status(404).send("No versions found")
    res.json(files)
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// ── Delete ────────────────────────────────────────────────────────────────────
router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
    if (!file) return res.status(404).send("File not found")

    await s3.send(new DeleteObjectCommand({ Bucket: process.env.PRIMARY_BUCKET, Key: file.s3Key }))

    if (file.isReplicated) {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.BACKUP_BUCKET, Key: file.s3Key }))
    }

    await File.findByIdAndDelete(req.params.id)
    res.json({ message: "File deleted successfully" })

  } catch (err) {
    console.error(err)
    res.status(500).send("Delete failed")
  }
})

module.exports = router
