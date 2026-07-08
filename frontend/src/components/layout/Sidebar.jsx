import { useState } from "react";
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
  LogOut
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
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const teacherNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/attendance", label: "Attendance", icon: <CalendarCheck className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const studentNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/my-attendance", label: "Attendance", icon: <CalendarCheck className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const parentNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/parent-portal", label: "Child Portal", icon: <Users className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
    { to: "/tickets/submit", label: "Report Issue", icon: <Bug className={iconClass} /> },
  ];

  const developerNav = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className={iconClass} /> },
    { to: "/tickets", label: "Issue Tickets", icon: <Ticket className={iconClass} /> },
    { to: "/students", label: "Students", icon: <GraduationCap className={iconClass} /> },
    { to: "/teachers", label: "Teachers", icon: <Users className={iconClass} /> },
    { to: "/classes", label: "Classes", icon: <BookOpen className={iconClass} /> },
    { to: "/subjects", label: "Subjects", icon: <BookMarked className={iconClass} /> },
    { to: "/attendance", label: "Attendance", icon: <CalendarCheck className={iconClass} /> },
    { to: "/profile", label: "Profile", icon: <User className={iconClass} /> },
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
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="border-b border-slate-100 flex flex-col items-center py-6 px-4">
        <div className="relative group mb-2.5">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-emerald-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-white rounded-full p-1.5 shadow-sm">
            <img
              src="/logo-1.png"
              alt="School Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>

        <p className="text-base font-bold text-slate-800 text-center leading-tight">
          Quit Green Valley
        </p>

        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest leading-normal mt-1">
          Convent School
        </p>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-primary-50/70 text-primary-700 shadow-[inset_3px_0_0_0_rgba(16,163,89,1)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Profile Box & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-white border border-slate-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-wider leading-none mt-0.5">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 min-h-screen flex-col shrink-0">
        {content}
      </aside>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
          <aside className="relative w-72 bg-white min-h-screen flex flex-col shadow-2xl animate-slide-in">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
