import { NavLink, useLocation } from 'react-router-dom'
import { Home, Sprout, CalendarCheck, BookOpen, Award, User, Camera } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

interface DockTab {
  id: string
  label: string
  route: string | null
}

const TABS: DockTab[] = [
  { id: 'home',      label: '首页',       route: '/'          },
  { id: 'garden',    label: '探索花园',   route: '/garden'    },
  { id: 'checkin',   label: '每日打卡',   route: '/checkin'   },
  { id: 'stool',     label: '拍便便分析', route: null         },
  { id: 'classroom', label: '探索课堂',   route: '/classroom' },
  { id: 'badges',    label: '成长勋章',   route: '/badges'    },
  { id: 'profile',   label: '我的',       route: '/profile'   },
]

function tabIcon(id: string, active: boolean) {
  const c = active ? 'text-white' : 'text-[#787063]'
  switch (id) {
    case 'home':      return <Home size={22} className={c} strokeWidth={2.2} />
    case 'garden':    return <Sprout size={22} className={c} strokeWidth={2.2} />
    case 'checkin':   return <CalendarCheck size={22} className={c} strokeWidth={2.2} />
    case 'stool':     return null
    case 'classroom': return <BookOpen size={22} className={c} strokeWidth={2.2} />
    case 'badges':    return <Award size={22} className={c} strokeWidth={2.2} />
    case 'profile':   return <User size={22} className={c} strokeWidth={2.2} />
    default:          return null
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BottomDock() {
  const { pathname } = useLocation()
  const stoolModalOpen = useUIStore((s) => s.stoolModalOpen)
  const setStoolModalOpen = useUIStore((s) => s.setStoolModalOpen)

  const isActive = (tab: DockTab) => {
    if (tab.id === 'stool') return stoolModalOpen
    if (tab.route === '/') return pathname === '/'
    return pathname.startsWith(tab.route!)
  }

  return (
    <nav
      className="shrink-0 self-center"
      style={{ width: '65%',
        height: 68,
        background: '#F9F8EF',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 10,
        overflow: 'visible',
      }}
    >
      <div
        className="flex justify-around h-full overflow-visible"
        style={{ alignItems: 'flex-end', paddingBottom: 8 }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab)

          /* --- Center hero tab --- */
          if (tab.id === 'stool') {
            return (
              <button
                key={tab.id}
                className="flex flex-col items-center justify-center active:scale-95 transition-transform shrink-0"
                style={{
                  width: 68,
                  height: 72,
                  marginTop: -24,
                  background: 'linear-gradient(180deg, #E2B5EB 0%, #B876C8 100%)',
                  borderRadius: '28px 28px 16px 16px',
                  boxShadow: '0 4px 12px rgba(184, 118, 200, 0.35)',
                }}
                onClick={() => setStoolModalOpen(true)}
              >
                <Camera size={22} className="text-white" strokeWidth={2.2} />
                <span
                  className="font-bold mt-0.5"
                  style={{ fontSize: 11, color: '#FFFFFF' }}
                >
                  拍便便分析
                </span>
              </button>
            )
          }

          /* --- Regular tabs --- */
          return (
            <NavLink
              key={tab.id}
              to={tab.route!}
              end={tab.route === '/'}
              className="flex flex-col items-center gap-0.5 shrink-0"
              style={{ minWidth: 0 }}
            >
              {({ isActive: navActive }) => {
                const showActive = navActive || active
                return (
                  <>
                    <span
                      className="flex items-center justify-center relative"
                      style={{ width: 44, height: 44 }}
                    >
                      {/* Semi-circular arch behind active icon */}
                      {showActive && (
                        <svg
                          className="absolute inset-0 transition-transform duration-200"
                          width="44"
                          height="44"
                          viewBox="0 0 44 44"
                          style={{ pointerEvents: 'none', transform: 'scale(1.5) translateY(-2px)' }}
                        >
                          <path
                            d="M4 44 L4 22 A18 18 0 0 1 40 22 L40 44 Z"
                            fill="#9F62B3"
                          />
                        </svg>
                      )}
                      <span
                        className="relative z-10 transition-transform duration-200"
                        style={{
                          transform: showActive ? 'scale(1.5) translateY(-4px)' : 'none',
                        }}
                      >
                        {tabIcon(tab.id, showActive)}
                      </span>
                    </span>
                    <span
                      className="transition-all duration-200 relative z-10"
                      style={{
                        fontSize: 11,
                        fontWeight: showActive ? 700 : 400,
                        color: showActive ? '#635A4D' : '#787063',
                      }}
                    >
                      {tab.label}
                    </span>
                  </>
                )
              }}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
