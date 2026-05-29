'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/panel', label: 'Panel',
    icon: (
      <svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
    ),
  },
  {
    href: '/viajes', label: 'Viajes',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M5 17h14"/><path d="M7 17v2"/><path d="M17 17v2"/><path d="m6 13 1.5-5h9L18 13"/><path d="M4 13h16v4H4Z"/></svg>
    ),
  },
  {
    href: '/ganancias', label: 'Ganancias',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
  {
    href: '/docs', label: 'Docs',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
    ),
  },
  {
    href: '/soporte', label: 'Soporte',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M4 14a8 8 0 0 1 16 0"/><path d="M18 19c0 1-1 2-2 2h-1"/><path d="M4 14v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z"/><path d="M20 14v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z"/></svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          className={`nav-item${pathname === href ? ' is-active' : ''}`}
          aria-current={pathname === href ? 'page' : undefined}
        >
          {icon}
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}