const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Reported', 'In Review', 'In Progress', 'Resolved'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  author: { type: String, default: 'System' },
  authorType: { type: String, enum: ['system', 'authority', 'citizen'], default: 'system' },
  timestamp: { type: Date, default: Date.now },
});

const issueSchema = new mongoose.Schema({
  issueId: {
    type: String,
    unique: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Road', 'Water', 'Electricity', 'Sanitation', 'Other'],
  },
  status: {
    type: String,
    enum: ['Reported', 'In Review', 'In Progress', 'Resolved'],
    default: 'Reported',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  photo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  location: {
    address: { type: String, required: [true, 'Location address is required'] },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  officialUpdate: {
    message: { type: String, default: '' },
    from: { type: String, default: '' },
    timestamp: { type: Date },
  },
  timeline: [timelineEventSchema],
  assignedTo: {
    department: { type: String, default: '' },
    officer: { type: String, default: '' },
    assignedAt: { type: Date },
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
  draftMode: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Auto-generate issueId before saving
issueSchema.pre('save', async function (next) {
  if (!this.issueId) {
    const count = await mongoose.model('Issue').countDocuments();
    this.issueId = `CL-${String(count + 1).padStart(3, '0')}`;
  }
  if (this.timeline.length === 0) {
    this.timeline.push({
      status: 'Reported',
      title: 'Issue Reported',
      description: 'Report successfully submitted.',
      author: 'System',
      authorType: 'system',
    });
  }
  next();
});

// Virtual for upvote count
issueSchema.virtual('upvoteCount').get(function () {
  return this.upvotes.length;
});

issueSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);
