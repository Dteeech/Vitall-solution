'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import IconPeopleImg from '@/components/icons/IconPeopleImg'


function IconPuzzle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M22 13.5V8a2 2 0 0 0-2-2h-3.5a1.5 1.5 0 0 1-1.06-.44L14 3.06A1.5 1.5 0 0 0 12.94 2H8a2 2 0 0 0-2 2v3.5a1.5 1.5 0 0 1-.44 1.06L3.06 11A1.5 1.5 0 0 0 3 12.06V17a2 2 0 0 0 2 2h5.5a1.5 1.5 0 0 1 1.06.44l1.5 1.5A1.5 1.5 0 0 0 14 22h4a2 2 0 0 0 2-2v-4.5a1.5 1.5 0 0 1 .44-1.06L22 13.5z" fill="currentColor" />
    </svg>
  )
}

function IconGrid({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="1" fill="currentColor" />
      <rect x="3" y="13" width="8" height="8" rx="1" fill="currentColor" />
      <rect x="13" y="13" width="8" height="8" rx="1" fill="currentColor" />
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname() || '/'
  const [modulesOpen, setModulesOpen] = useState(
    pathname.startsWith('/recruiter') || pathname.startsWith('/planning') || pathname.startsWith('/formation')
  )

  const items = [
    { label: 'Dashboard', href: '/admin', icon: <IconGrid className="text-white" /> },
  ]

  const modules = {
    label: 'Mes modules',
    icon: <IconPuzzle className="text-white" />,
    children: [
      { label: 'Recrutement', href: '/recruiter' },
      { label: 'Planning', href: '/planning' },
      { label: 'Formation', href: '/formation' },
    ],
  }

  return (
    <aside className="w-64 bg-blue-900 text-white min-h-screen p-6 hidden md:flex flex-col gap-6 rounded-tr-3xl rounded-br-3xl">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-full flex items-center justify-center">
          <Image src="/Logo-Blanc-avec-texte.png" alt="Vitall" width={96} height={28} priority />
        </div>
        <div className="w-full border-b border-white/20" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2">
        <ul className="flex flex-col gap-3">
          {items.map((it) => {
            const active = pathname === it.href
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={
                    `${active ? 'bg-white text-blue-900' : 'hover:bg-white/5 text-white'} flex items-center gap-3 px-4 py-2 rounded-md transition-colors duration-150`
                  }
                >
                  <span className="shrink-0">{it.icon}</span>
                  <span className="font-medium">{it.label}</span>
                </Link>
              </li>
            )
          })}

          {/* Modules multi-level */}
          <li>
            <button
              onClick={() => setModulesOpen((s: boolean) => !s)}
              aria-expanded={modulesOpen}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-md transition-colors duration-150 ${
                modulesOpen ? 'bg-white text-blue-900' : 'hover:bg-white/5 text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="shrink-0">{modules.icon}</span>
                <span className="font-medium">{modules.label}</span>
              </span>
              <svg
                className={`w-4 h-4 transform transition-transform ${modulesOpen ? 'rotate-180' : 'rotate-0'}`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" stroke={modulesOpen ? '#132F49' : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {modulesOpen && (
              <ul className="mt-2 ml-6 flex flex-col gap-2">
                {modules.children.map((child) => {
                  const active = pathname === child.href || pathname.startsWith(child.href)
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 ${
                          active ? 'bg-white text-blue-900' : 'hover:bg-white/5 text-white/90'
                        }`}
                      >
                        <span className="shrink-0 inline-block w-5 h-5 text-primary-token">
                          <IconPeopleImg alt={child.label} />
                        </span>
                        <span className="text-sm">{child.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <div className="mt-auto w-full">
        <div className="w-full border-t border-white/10 mb-4" />
        <div className="flex flex-col gap-2 text-sm">
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.82 2.82l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.28 17.88l.06-.06A1.65 1.65 0 0 0 2.67 15a1.65 1.65 0 0 0-1.51-1H1a2 2 0 1 1 0-4h.16A1.65 1.65 0 0 0 2.67 8a1.65 1.65 0 0 0-.33-1.82L2.28 6A2 2 0 1 1 5.1 3.18l.06.06A1.65 1.65 0 0 0 7 3.57 1.65 1.65 0 0 0 8.51 2.58H9a2 2 0 1 1 4 0h.49A1.65 1.65 0 0 0 15 3.57a1.65 1.65 0 0 0 1.82.33l.06-.06A2 2 0 1 1 21.72 6l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a2 2 0 1 1 0 4h-.16a1.65 1.65 0 0 0-1.51 1z" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Paramètres
          </button>

          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M10 17l5-5-5-5v10z" fill="#fff" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  )
}
