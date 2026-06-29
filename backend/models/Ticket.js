const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      enum: [
        'Dashboard',
        'Students',
        'Teachers',
        'Classes',
        'Subjects',
        'Attendance',
        'Fees',
        'Results',
        'Timetable',
        'Notices',
        'Homework',
        'Events',
        'Messages',
        'Other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    screenshot: {
      type: String,
      default: '',
    },
    referenceUrl: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Complete'],
      default: 'Pending',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    internalNotes: {
      type: String,
      default: '',
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Ticket = mongoose.model('Ticket');
    const lastTicket = await Ticket.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextNum = 1;
    if (lastTicket && lastTicket.ticketId) {
      const match = lastTicket.ticketId.match(/TKT-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    this.ticketId = `#TKT-${String(nextNum).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
