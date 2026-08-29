const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
      index: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedAccessToken: {
      type: String,
      default: null,
    },
    encryptedRefreshToken: {
      type: String,
      default: null,
    },
    encryptedApiKey: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one integration record per provider per user
integrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

const Integration = mongoose.model('Integration', integrationSchema);

module.exports = Integration;
