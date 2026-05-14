import { useWeb3 } from '../../context/Web3Context.jsx'
import { NavLink } from 'react-router-dom'

const navItems = {
  STUDENT: [
    { to: '/student',         icon: DashIcon,   label: 'Home' },
    { to: '/student/history', icon: HistoryIcon, label: 'History' },
  ],
  PROFESSOR: [
    { to: '/professor',         icon: DashIcon,    label: 'Home' },
    { to: '/professor/session', icon: PlusIcon,    label: 'New' },
    { to: '/professor/list',    icon: ListIcon,    label: 'Sessions' },
  ],
  ADMIN: [
    { to: '/admin',           icon: DashIcon,    label: 'Home' },
    { to: '/admin/register',  icon: PlusIcon,    label: 'Register' },
    { to: '/admin/users',     icon: UsersIcon,   label: 'Users' },
  ],
}

export default function MobileNav() {
  const { role } = useWeb3()
  const items = navItems[role] || []

  return (
    <nav className="mobile-nav lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={true}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-150 ${
              isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon active={isActive} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function DashIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function HistoryIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2">
      <polyline points="12 8 12 12 14 14" />
      <path d="M3.05 11a9 9 0 1 0 .5-4" />
      <polyline points="3 3 3 7 7 7" />
    </svg>
  )
}
function PlusIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}
function ListIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function UsersIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
