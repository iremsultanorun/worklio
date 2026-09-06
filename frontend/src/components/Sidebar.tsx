'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Bell,
  Wallet,
  CreditCard,
  FileText,
  Target,
  MessageSquare,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
}

type GroupedNavItem = {
  label: string
  icon: React.ElementType
  items: NavItem[]
}

type BottomBarItem = NavItem | GroupedNavItem

function isGrouped(item: BottomBarItem): item is GroupedNavItem {
  return 'items' in item
}

const navItems: NavItem[] = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/reminders', label: 'Hatırlatıcılar', icon: Bell },
  { href: '/cash', label: 'Kasa', icon: Wallet },
  { href: '/payments', label: 'Ödemeler', icon: CreditCard },
  { href: '/notes', label: 'Notlar', icon: FileText },
  { href: '/goals', label: 'Hedefler', icon: Target },
  { href: '/customer-reviews', label: 'Müşteri Yorumları', icon: MessageSquare },
]

const bottomBarItems: BottomBarItem[] = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/reminders', label: 'Hatırlatıcı', icon: Bell },
  {
    label: 'Finans',
    icon: Wallet,
    items: [
      { href: '/cash', label: 'Kasa', icon: Wallet },
      { href: '/payments', label: 'Ödemeler', icon: CreditCard },
    ],
  },
  {
    label: 'İçerik',
    icon: FileText,
    items: [
      { href: '/notes', label: 'Notlar', icon: FileText },
      { href: '/customer-reviews', label: 'Yorumlar', icon: MessageSquare },
    ],
  },
  { href: '/goals', label: 'Hedefler', icon: Target },
]


export default function Sidebar() {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => { setOpenGroup(null) }, [pathname])

  return (
    <>
      <aside className="hidden lg:flex w-56 h-screen bg-white border-r border-gray-100 flex-col py-6 shrink-0">
        <div className="px-4 mb-8">
          <span className="text-4xl font-extrabold text-violet-600">Worklio</span>
          <p className="text-sm text-gray-500 mt-3">Yönetim Paneli</p>
        </div>
        <nav className="flex flex-col gap-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-all duration-200 flex items-center gap-3 px-3 py-3 rounded-lg text-sm
                  ${isActive
                    ? 'bg-violet-50 text-violet-600 font-medium border-l-4 border-violet-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-violet-600'
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <aside className="hidden md:flex lg:hidden w-16 h-screen bg-white border-r border-gray-100 flex-col py-6 items-center shrink-0">
        <div className="mb-8">
          <span className="text-xl font-extrabold text-violet-600">W</span>
        </div>
        <nav className="flex flex-col gap-2 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center py-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-violet-50 text-violet-600 border-l-4 border-violet-600'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-violet-600'
                  }`}
              >
                <Icon size={20} />
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile — bottom bar (below md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40" ref={popupRef}>

        {/* Popups */}
        {bottomBarItems.map((item, index) => {
          if (!isGrouped(item)) return null
          if (openGroup !== item.label) return null

          const totalItems = bottomBarItems.length
          const percent = (index / (totalItems - 1)) * 100

          return (
            <div
              key={item.label}
              className="absolute bottom-full mb-4 flex flex-col items-center gap-3"
              style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
            >
              {item.items.map((sub) => {
                const SubIcon = sub.icon
                const isActive = pathname === sub.href
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-violet-500 border border-gray-200'
                    }`}>
                      <SubIcon size={20} />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500 leading-none">
                      {sub.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          )
        })}

        {/* Bottom bar — NO text, only icons in circles */}
        <nav className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex items-center justify-around">
            {bottomBarItems.map((item) => {
              const isActive = isGrouped(item)
                ? item.items.some(sub => sub.href === pathname)
                : item.href === pathname

              if (isGrouped(item)) {
                const Icon = item.icon
                const isOpen = openGroup === item.label
                return (
                  <button
                    key={item.label}
                    onClick={() => setOpenGroup(isOpen ? null : item.label)}
                    className="flex items-center justify-center"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : isOpen
                        ? 'bg-violet-100 text-violet-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon size={20} />
                    </div>
                  </button>
                )
              }

              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}