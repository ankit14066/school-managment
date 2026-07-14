import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  BookMarked,
  CalendarCheck,
  User,
  Bug,
  Ticket,
  LogOut,
  IndianRupee,
  BarChart3,
  Calendar,
  Bell,
  ClipboardList,
  CalendarDays,
  Mail,
} from "lucide-react";

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout, isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const iconClass = "w-5 h-5 shrink-0";

  const adminNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/students", label: "Students", icon: <GraduationCap className={iconClass} /> },
    { to: "/teachers", label: "Teachers", icon: <Users className={iconClass} /> },
    { to: "/classes", label: "Classes", icon: <BookOpen className={iconClass} /> },
    { to: "/subjects", label: "Subjects", icon: <BookMarked className={iconClass} /> },
    { to: "/attendance", label: "Attendance", icon: <CalendarCheck className={iconClass} /> },
    // { to: "/fees", label: "Fees", icon: <IndianRupee className={iconClass} /> },
    // { to: "/results", label: "Results", icon: <BarChart3 className={iconClass} /> },
    // { to: "/timetable", label: "Timetable", icon: <Calendar className={iconClass} /> },
    // { to: "/notices", label: "Notices", icon: <Bell className={iconClass} /> },
    // { to: "/homework", label: "Homework", icon: <ClipboardList className={iconClass} /> },
    // { to: "/events", label: "Events", icon: <CalendarDays className={iconClass} /> },
    // { to: "/messages", label: "Messages", icon: <Mail className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const teacherNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/attendance", label: "Attendance", icon: <CalendarCheck className={iconClass} /> },
    // { to: "/homework", label: "Homework", icon: <ClipboardList className={iconClass} /> },
    // { to: "/timetable", label: "Timetable", icon: <Calendar className={iconClass} /> },
    // { to: "/notices", label: "Notices", icon: <Bell className={iconClass} /> },
    // { to: "/events", label: "Events", icon: <CalendarDays className={iconClass} /> },
    // { to: "/messages", label: "Messages", icon: <Mail className={iconClass} /> },
    // { to: "/results", label: "Results", icon: <BarChart3 className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const studentNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/my-attendance", label: "Attendance", icon: <CalendarCheck className={iconClass} /> },
    // { to: "/homework", label: "Homework", icon: <ClipboardList className={iconClass} /> },
    // { to: "/timetable", label: "Timetable", icon: <Calendar className={iconClass} /> },
    // { to: "/my-results", label: "Results", icon: <BarChart3 className={iconClass} /> },
    // { to: "/notices", label: "Notices", icon: <Bell className={iconClass} /> },
    // { to: "/events", label: "Events", icon: <CalendarDays className={iconClass} /> },
    // { to: "/messages", label: "Messages", icon: <Mail className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const parentNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/parent-portal", label: "Child Portal", icon: <Users className={iconClass} /> },
    { to: "/homework", label: "Homework", icon: <ClipboardList className={iconClass} /> },
    { to: "/timetable", label: "Timetable", icon: <Calendar className={iconClass} /> },
    { to: "/notices", label: "Notices", icon: <Bell className={iconClass} /> },
    { to: "/events", label: "Events", icon: <CalendarDays className={iconClass} /> },
    { to: "/messages", label: "Messages", icon: <Mail className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const developerNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/students", label: "Students", icon: <GraduationCap className={iconClass} /> },
    { to: "/teachers", label: "Teachers", icon: <Users className={iconClass} /> },
    { to: "/classes", label: "Classes", icon: <BookOpen className={iconClass} /> },
    { to: "/subjects", label: "Subjects", icon: <BookMarked className={iconClass} /> },
    { to: "/attendance", label: "Attendance", icon: <CalendarCheck className={iconClass} /> },
    { to: "/fees", label: "Fees", icon: <IndianRupee className={iconClass} /> },
    { to: "/results", label: "Results", icon: <BarChart3 className={iconClass} /> },
    { to: "/timetable", label: "Timetable", icon: <Calendar className={iconClass} /> },
    { to: "/notices", label: "Notices", icon: <Bell className={iconClass} /> },
    { to: "/homework", label: "Homework", icon: <ClipboardList className={iconClass} /> },
    { to: "/events", label: "Events", icon: <CalendarDays className={iconClass} /> },
    { to: "/messages", label: "Messages", icon: <Mail className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const navItems = user?.role === 'developer'
    ? developerNav
    : isAdmin
      ? adminNav
      : isTeacher
        ? teacherNav
        : isParent
          ? parentNav
          : studentNav;

  const content = (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="border-b border-slate-100 flex flex-col items-center py-6 px-4 shrink-0">
        <div className="mb-3 bg-white rounded-full p-1.5 shadow-xs border border-slate-100">
          <img
            src="/logo-1.png"
            alt="School Logo"
            className="h-20 w-20 object-contain"
            onError={(e) => {
              e.target.src = "https://cdn-icons-png.flaticon.com/512/167/167707.png";
            }}
          />
        </div>
        <p className="text-base font-extrabold text-slate-800 text-center tracking-tight leading-none">
          Quit Green Valley
        </p>
        <p className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest leading-none mt-1.5">
          Convent School
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold ${isActive
                ? "bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white border border-slate-100 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-base shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1">{user?.name}</p>
            <p className="text-xs font-bold text-slate-400 capitalize tracking-wide leading-none">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 min-h-screen flex-col shrink-0 sticky top-0">
        {content}
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} />
          <aside className="relative w-72 bg-white min-h-screen flex flex-col shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
