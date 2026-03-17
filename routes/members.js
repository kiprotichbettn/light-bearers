"use strict";

const express = require("express");
const router = express.Router();
const Member = require("../models/Member");

function formatValidationError(err) {
  if (!err?.errors) return null;
  return Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
}

// Create member (POST /api/members)
router.post("/", async (req, res) => {
  try {
    const member = await Member.create(req.body);

    return res.status(201).json({
      ok: true,
      member: {
        id: member._id,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        ageRange: member.ageRange,
        county: member.county,
        country: member.country,
        chapter: member.chapter,
        interests: member.interests,
        source: member.source,
        createdAt: member.createdAt,
      },
    });
  } catch (err) {
    // Duplicate email error
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ ok: false, error: "Email already registered" });
    }

    // Mongoose schema validation
    if (err?.name === "ValidationError") {
      return res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: formatValidationError(err),
      });
    }

    console.error("Create member error:", err);
    return res.status(500).json({ ok: false, error: "Failed to create member" });
  }
});

// List members (GET /api/members) - basic admin list
router.get("/", async (req, res) => {
  try {
    const members = await Member.find({})
      .select(
        "fullName email phone ageRange county country chapter interests source createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ ok: true, members });
  } catch (err) {
    console.error("List members error:", err);
    return res.status(500).json({ ok: false, error: "Failed to list members" });
  }
});

module.exports = router;