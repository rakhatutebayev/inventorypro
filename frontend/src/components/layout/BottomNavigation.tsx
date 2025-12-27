import { NavLink } from 'react-router-dom';

const navigationItems = [
  { path: '/assets', label: 'Assets', icon: '📦' },
  { path: '/movements', label: 'Movements', icon: '🔄' },
  { path: '/inventory', label: 'Inventory', icon: '✓' },
  { path: '/print', label: 'Print', icon: '🖨️' },
  { path: '/reports', label: 'Reports', icon: '📊' },
  { path: '/references', label: 'References', icon: '📋' },
];

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-primary-600'
              }`
            }
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}


