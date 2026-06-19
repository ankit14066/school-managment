require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const FeeStructure = require('./models/FeeStructure');
const Parent = require('./models/Parent');
const Notice = require('./models/Notice');
const Timetable = require('./models/Timetable');
const Homework = require('./models/Homework');
const Event = require('./models/Event');
const Message = require('./models/Message');
const Attendance = require('./models/Attendance');
const Fee = require('./models/Fee');
const Exam = require('./models/Exam');
const Result = require('./models/Result');
const ActivityLog = require('./models/ActivityLog');

const seedData = async () => {
  await connectDB();

  // Clear ALL collections (including old schema data)
  await Promise.all([
    User.deleteMany({}),
    Teacher.deleteMany({}),
    Student.deleteMany({}),
    Parent.deleteMany({}),
    Class.deleteMany({}),
    Subject.deleteMany({}),
    FeeStructure.deleteMany({}),
    Notice.deleteMany({}),
    Timetable.deleteMany({}),
    Homework.deleteMany({}),
    Event.deleteMany({}),
    Message.deleteMany({}),
    Attendance.deleteMany({}),
    Fee.deleteMany({}),
    Exam.deleteMany({}),
    Result.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  console.log('Cleared all existing data');

  const academicYear = '2025-2026';

  // Use User.create() always — insertMany skips password hashing!
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin',
  });
  console.log('Admin created: admin@school.com / admin123');

  const classes = await Class.insertMany([
    { name: '10', section: 'A', academicYear, capacity: 40, createdBy: admin._id },
    { name: '10', section: 'B', academicYear, capacity: 40, createdBy: admin._id },
    { name: '11', section: 'A', academicYear, capacity: 35, createdBy: admin._id },
  ]);
  console.log(`Created ${classes.length} classes`);

  const teacherUser1 = await User.create({
    name: 'Rajesh Kumar', email: 'rajesh@school.com', password: 'teacher123', role: 'teacher',
  });
  const teacherUser2 = await User.create({
    name: 'Priya Sharma', email: 'priya@school.com', password: 'teacher123', role: 'teacher',
  });

  const teachers = await Teacher.insertMany([
    {
      user: teacherUser1._id, employeeId: 'EMP001', phone: '9876543210',
      qualification: 'M.Sc Mathematics', joiningDate: new Date('2020-06-01'), createdBy: admin._id,
    },
    {
      user: teacherUser2._id, employeeId: 'EMP002', phone: '9876543211',
      qualification: 'M.A English', joiningDate: new Date('2021-07-15'), createdBy: admin._id,
    },
  ]);
  console.log('Teachers created: rajesh@school.com / teacher123');

  await Class.findByIdAndUpdate(classes[0]._id, { classTeacher: teachers[0]._id });

  const subjects = await Subject.insertMany([
    { name: 'Mathematics', code: 'MATH10A', class: classes[0]._id, teacher: teachers[0]._id, createdBy: admin._id },
    { name: 'English', code: 'ENG10A', class: classes[0]._id, teacher: teachers[1]._id, createdBy: admin._id },
    { name: 'Science', code: 'SCI10A', class: classes[0]._id, createdBy: admin._id },
    { name: 'Mathematics', code: 'MATH11A', class: classes[2]._id, teacher: teachers[0]._id, createdBy: admin._id },
  ]);

  await Teacher.findByIdAndUpdate(teachers[0]._id, { subjects: [subjects[0]._id, subjects[3]._id] });
  await Teacher.findByIdAndUpdate(teachers[1]._id, { subjects: [subjects[1]._id] });
  await Class.findByIdAndUpdate(classes[0]._id, { subjects: [subjects[0]._id, subjects[1]._id, subjects[2]._id] });
  console.log(`Created ${subjects.length} subjects`);

  const studentUser1 = await User.create({
    name: 'Amit Singh', email: 'amit@school.com', password: 'student123', role: 'student',
  });
  const studentUser2 = await User.create({
    name: 'Sneha Patel', email: 'sneha@school.com', password: 'student123', role: 'student',
  });
  const studentUser3 = await User.create({
    name: 'Rohan Gupta', email: 'rohan@school.com', password: 'student123', role: 'student',
  });

  const students = await Student.insertMany([
    {
      user: studentUser1._id, rollNumber: '10A001', class: classes[0]._id,
      dateOfBirth: new Date('2009-03-15'), parentName: 'Vikram Singh',
      phone: '9988776655', address: '123 Main Street', createdBy: admin._id,
    },
    {
      user: studentUser2._id, rollNumber: '10A002', class: classes[0]._id,
      dateOfBirth: new Date('2009-07-22'), parentName: 'Meera Patel',
      phone: '9988776656', address: '456 Park Avenue', createdBy: admin._id,
    },
    {
      user: studentUser3._id, rollNumber: '11A001', class: classes[2]._id,
      dateOfBirth: new Date('2008-11-10'), parentName: 'Anil Gupta',
      phone: '9988776657', createdBy: admin._id,
    },
  ]);

  await Class.findByIdAndUpdate(classes[0]._id, { students: [students[0]._id, students[1]._id] });
  await Class.findByIdAndUpdate(classes[2]._id, { students: [students[2]._id] });
  console.log('Students created: amit@school.com / student123');

  await FeeStructure.insertMany([
    { class: classes[0]._id, tuition: 5000, transport: 1500, misc: 500, academicYear, createdBy: admin._id },
    { class: classes[2]._id, tuition: 6000, transport: 1500, misc: 500, academicYear, createdBy: admin._id },
  ]);

  await User.create({
    name: 'Vikram Singh', email: 'vikram.parent@school.com', password: 'parent123', role: 'parent',
  }).then(async (parentUser) => {
    await Parent.create({
      user: parentUser._id, linkedStudent: students[0]._id,
      phone: '9988776655', relationship: 'Father', createdBy: admin._id,
    });
  });

  await Notice.create({
    title: 'Welcome to School Management System',
    body: 'System is ready! Login with your assigned credentials.',
    targetAudience: 'all', postedBy: admin._id,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  await Event.create({
    name: 'Annual Sports Day',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    type: 'event', description: 'Annual sports competition', createdBy: admin._id,
  });

  const userCount = await User.countDocuments();
  console.log(`\n--- Seed completed! Total users in DB: ${userCount} ---`);
  console.log('\nLogin credentials (use these, NOT ankit@gmail.com):');
  console.log('  Admin:   admin@school.com / admin123');
  console.log('  Teacher: rajesh@school.com / teacher123');
  console.log('  Student: amit@school.com / student123');
  console.log('  Parent:  vikram.parent@school.com / parent123');
  console.log('\nRefresh MongoDB Atlas page to see new data.');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
