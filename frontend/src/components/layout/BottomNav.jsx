import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const { isAdmin, isTeacher, isStudent, isParent } = useAuth();

  const adminItems = [
    { to: '/dashboard', icon: '📊', label: 'Home' },
    { to: '/notices', icon: '📢', label: 'Notices' },
    { to: '/attendance', icon: '📋', label: 'Attend' },
    { to: '/messages', icon: '✉️', label: 'Msgs' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  const teacherItems = [
    { to: '/dashboard', icon: '📊', label: 'Home' },
    { to: '/attendance', icon: '📋', label: 'Attend' },
    { to: '/homework', icon: '📝', label: 'HW' },
    { to: '/messages', icon: '✉️', label: 'Msgs' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  const studentItems = [
    { to: '/dashboard', icon: '📊', label: 'Home' },
    { to: '/homework', icon: '📝', label: 'HW' },
    { to: '/timetable', icon: '🗓️', label: 'Schedule' },
    { to: '/my-results', icon: '📊', label: 'Results' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  const parentItems = [
    { to: '/dashboard', icon: '📊', label: 'Home' },
    { to: '/parent-portal', icon: '👨‍👧', label: 'Child' },
    { to: '/homework', icon: '📝', label: 'HW' },
    { to: '/messages', icon: '✉️', label: 'Msgs' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  const items = isAdmin ? adminItems : isTeacher ? teacherItems : isParent ? parentItems : studentItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex justify-around py-2">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => `flex flex-col items-center px-2 py-1 text-xs ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
