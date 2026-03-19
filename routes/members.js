"use strict";

const express = require("express");
const router = express.Router();
const Member = require("../models/member");

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
    const payload = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      ageRange: req.body.ageRange,
      county: req.body.county,
      country: req.body.country,
      chapter: req.body.chapter,
      interests: req.body.interests,
      source: req.body.source || "website",
      isActive: req.body.isActive,
      joinedAt: req.body.joinedAt,
      notes: req.body.notes,
    };

    const member = await Member.create(payload);

    return res.status(201).json({
      ok: true,
      message: "Member registered successfully",
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
        isActive: member.isActive,
        joinedAt: member.joinedAt,
        notes: member.notes,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: "Email already registered",
      });
    }

    if (err?.name === "ValidationError") {
      return res.status(400).json({
        ok: false,
        error: "Validation failed",
        details: formatValidationError(err),
      });
    }

    console.error("Create member error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create member",
    });
  }
});

// List members (GET /api/members)
router.get("/", async (req, res) => {
  try {
    const members = await Member.find({})
      .select(
        "fullName email phone ageRange county country chapter interests source isActive joinedAt notes createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({
      ok: true,
      count: members.length,
      members,
    });
  } catch (err) {
    console.error("List members error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to list members",
    });
  }
});

module.exports = router;