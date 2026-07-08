import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Bell,
  CalendarCheck,
  Mail,
  User,
  BookOpen,
  Calendar,
  Users
} from 'lucide-react';

const BottomNav = () => {
  const { isAdmin, isTeacher, isStudent, isParent } = useAuth();

  const iconClass = "w-5 h-5 mb-0.5";

  const adminItems = [
    { to: '/dashboard', icon: <LayoutDashboard className={iconClass} />, label: 'Home' },
    { to: '/notices', icon: <Bell className={iconClass} />, label: 'Notices' },
    { to: '/attendance', icon: <CalendarCheck className={iconClass} />, label: 'Attend' },
    { to: '/messages', icon: <Mail className={iconClass} />, label: 'Msgs' },
    { to: '/profile', icon: <User className={iconClass} />, label: 'Profile' },
  ];

  const teacherItems = [
    { to: '/dashboard', icon: <LayoutDashboard className={iconClass} />, label: 'Home' },
    { to: '/attendance', icon: <CalendarCheck className={iconClass} />, label: 'Attend' },
    { to: '/homework', icon: <BookOpen className={iconClass} />, label: 'HW' },
    { to: '/messages', icon: <Mail className={iconClass} />, label: 'Msgs' },
    { to: '/profile', icon: <User className={iconClass} />, label: 'Profile' },
  ];

  const studentItems = [
    { to: '/dashboard', icon: <LayoutDashboard className={iconClass} />, label: 'Home' },
    { to: '/homework', icon: <BookOpen className={iconClass} />, label: 'HW' },
    { to: '/timetable', icon: <Calendar className={iconClass} />, label: 'Schedule' },
    { to: '/my-results', icon: <LayoutDashboard className={iconClass} />, label: 'Results' },
    { to: '/profile', icon: <User className={iconClass} />, label: 'Profile' },
  ];

  const parentItems = [
    { to: '/dashboard', icon: <LayoutDashboard className={iconClass} />, label: 'Home' },
    { to: '/parent-portal', icon: <Users className={iconClass} />, label: 'Child' },
    { to: '/homework', icon: <BookOpen className={iconClass} />, label: 'HW' },
    { to: '/messages', icon: <Mail className={iconClass} />, label: 'Msgs' },
    { to: '/profile', icon: <User className={iconClass} />, label: 'Profile' },
  ];

  const items = isAdmin ? adminItems : isTeacher ? teacherItems : isParent ? parentItems : studentItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 safe-area-bottom">
      <div className="flex justify-around py-2.5 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex flex-col items-center justify-center flex-1 py-1 text-xs font-bold ${isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
