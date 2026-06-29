const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Submit a new issue ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res, next) => {
  try {
    const { title, moduleName, description, referenceUrl, priority } = req.body;
    let screenshot = '';

    if (req.file) {
      screenshot = `/uploads/tickets/${req.file.filename}`;
    }

    const ticket = await Ticket.create({
      title,
      moduleName,
      description,
      screenshot,
      referenceUrl,
      priority: priority || 'Medium',
      submittedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issue tickets (Developer only)
// @route   GET /api/tickets
// @access  Private (Developer only)
const getTickets = async (req, res, next) => {
  try {
    const { status, priority, moduleName, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (moduleName) query.moduleName = moduleName;

    if (search) {
      const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      const userIds = users.map((u) => u._id);

      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } },
        { submittedBy: { $in: userIds } },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('submittedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ticket by ID
// @route   GET /api/tickets/:id
// @access  Private (Submitter or Developer)
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('submittedBy', 'name email role');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (req.user.role !== 'developer' && ticket.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket status and internal notes
// @route   PUT /api/tickets/:id
// @access  Private (Developer only)
const updateTicket = async (req, res, next) => {
  try {
    const { status, internalNotes } = req.body;
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status) {
      ticket.status = status;
      if (status === 'Complete') {
        ticket.closedAt = new Date();
      } else {
        ticket.closedAt = undefined;
      }
    }

    if (internalNotes !== undefined) {
      ticket.internalNotes = internalNotes;
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('submittedBy', 'name email role');

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
};
