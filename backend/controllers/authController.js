const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'student') {
      const Student = require('../models/Student');
      profile = await Student.findOne({ user: user._id })
        .populate('class', 'name section academicYear');
    } else if (user.role === 'teacher') {
      const Teacher = require('../models/Teacher');
      profile = await Teacher.findOne({ user: user._id })
        .populate('subjects', 'name code');
    } else if (user.role === 'parent') {
      const Parent = require('../models/Parent');
      profile = await Parent.findOne({ user: user._id })
        .populate({
          path: 'linkedStudent',
          populate: [{ path: 'user', select: 'name' }, { path: 'class', select: 'name section' }],
        });
    }

    res.json({ success: true, data: { ...user.toObject(), profile } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, updatePassword };
