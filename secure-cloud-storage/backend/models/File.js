const mongoose = require("mongoose")

const FileSchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  filename:     { type: String, required: true },
  version:      { type: Number, required: true },
  s3Key:        { type: String, required: true },
  mimeType:     { type: String, default: "" },
  isReplicated: { type: Boolean, default: false },
  uploadedAt:   { type: Date, default: Date.now },
  summary:      { type: String, default: "" },
  tags:         { type: [String], default: [] },
  category:     { type: String, default: "" }
})

module.exports = mongoose.model("File", FileSchema)