'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FieldSchema = new Schema({
  name: { type: String },
  value: { type: String },
});

const GabUserSchema = new Schema({
  id: { type: String, required: true, unique: true, index: 1 },
  username: { type: String },
  acct: { type: String },
  display_name: { type: String },
  locked: { type: Boolean },
  bot: { type: Boolean },
  created_at: { type: Date },
  note: { type: String },
  url: { type: String },
  avatar: { type: String },
  avatar_static: { type: String },
  header: { type: String },
  header_static: { type: String },
  is_spam: { type: Boolean },
  followers_count: { type: Number },
  following_count: { type: Number },
  statuses_count: { type: Number },
  is_pro: { type: Boolean },
  is_verified: { type: Boolean },
  is_donor: { type: Boolean },
  is_investor: { type: Boolean },
  fields: { type: [FieldSchema] },
});

module.exports = mongoose.model('GabUser', GabUserSchema);