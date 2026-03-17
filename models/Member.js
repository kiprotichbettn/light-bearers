"use strict";

const mongoose = require("mongoose");

const AGE_RANGES = ["Under 18", "18-24", "25-34", "35-44", "45+"]; // keep consistent
const SOURCES = ["website", "google_form", "admin"];

const MemberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "fullName is required"],
      trim: true,
      minlength: [2, "fullName must be at least 2 characters"],
      maxlength: [120, "fullName must be at most 120 characters"],
    },

    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "email must be a valid email address"],
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [30, "phone must be at most 30 characters"],
    },

    ageRange: {
      type: String,
      required: [true, "ageRange is required"],
      enum: {
        values: AGE_RANGES,
        message: `ageRange must be one of: ${AGE_RANGES.join(", ")}`,
      },
    },

    county: {
      type: String,
      required: [true, "county is required"],
      trim: true,
      minlength: [2, "county must be at least 2 characters"],
      maxlength: [80, "county must be at most 80 characters"],
    },

    country: {
      type: String,
      trim: true,
      default: "Kenya",
      minlength: [2, "country must be at least 2 characters"],
      maxlength: [80, "country must be at most 80 characters"],
    },

    chapter: {
      type: String,
      trim: true,
      maxlength: [80, "chapter must be at most 80 characters"],
    },

    interests: [{ type: String, trim: true }],

    source: {
      type: String,
      enum: {
        values: SOURCES,
        message: `source must be one of: ${SOURCES.join(", ")}`,
      },
      default: "website",
    },
  },
  { timestamps: true }
);

// Normalize fullName spacing
MemberSchema.pre("validate", function () {
  if (this.fullName) this.fullName = this.fullName.replace(/\s+/g, " ").trim();
});

// Explicit collection name "members"
module.exports = mongoose.model("Member", MemberSchema, "members");