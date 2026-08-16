import { type LucideIcon, Square, CircleCheck, Droplet, Salad, Heart, Candy, Moon, Footprints, Leaf, Lightbulb, Handshake, TreePine, Settings, Volume2, VolumeX } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Triple-tier icon system:                                           */
/*    1. CUSTOM — inline SVG from icon library (tintable, currentColor) */
/*    2. CUTE   — colored cartoon SVG (OpenMoji, self-hosted)           */
/*    3. LINE   — Lucide stroke icons (fallback for missing shapes)     */
/* ------------------------------------------------------------------ */

// All custom SVG icons loaded as raw strings (inline rendering for currentColor support)
const svgModules = import.meta.glob<string>('../assets/icons/*.svg', { query: '?raw', eager: true, import: 'default' })

function svgPath(name: string) {
  return `../assets/icons/${name}`
}

function svgStr(name: string): string | undefined {
  return svgModules[svgPath(name)]
}

// Semantic key → custom SVG filename (from icon library)
const CUSTOM: Record<string, string> = {
  // Navigation & chrome
  home: 'Home.svg',
  settings: 'Setting.svg',
  search: 'Search.svg',
  calendar: 'Calendar.svg',
  camera: 'Camera.svg',
  lock: 'Lock.svg',
  unlock: 'Unlock.svg',
  star: 'Star.svg',
  delete: 'Delete.svg',
  edit: 'Edit.svg',
  plus: 'Plus.svg',
  download: 'Download.svg',
  upload: 'Upload.svg',
  video: 'Video.svg',
  play: 'Play.svg',
  // Communication
  message: 'Message.svg',
  chat: 'Chat.svg',
  notification: 'Notification.svg',
  send: 'Send.svg',
  voice: 'Voice.svg',
  voice2: 'Voice 2.svg',
  // Users
  user: '2 User.svg',
  users: '3 User.svg',
  addUser: 'Add User.svg',
  profile: 'Profile.svg',
  // Security & status
  shield: 'Shield Done.svg',
  shieldFail: 'Shield Fail.svg',
  danger: 'Danger.svg',
  info: 'Info Circle.svg',
  password: 'Password.svg',
  login: 'Login.svg',
  logout: 'Logout.svg',
  hide: 'Hide.svg',
  show: 'Show.svg',
  // Files & media
  document: 'Document.svg',
  folder: 'Folder.svg',
  image: 'Image.svg',
  paper: 'Paper.svg',
  // Commerce
  bag: 'Bag.svg',
  buy: 'Buy.svg',
  wallet: 'Wallet.svg',
  discount: 'Discount.svg',
  ticket: 'Ticket.svg',
  ticketStar: 'Ticket Star.svg',
  bookmark: 'Bookmark.svg',
  // UI
  close: 'Close Square.svg',
  check: 'Tick Square.svg',
  checkSquare: 'Tick Square.svg',
  trash: 'Delete.svg',
  chevronLeft: 'Arrow - Left 2.svg',
  chevronRight: 'Arrow - Right 2.svg',
  filter: 'Filter.svg',
  filter2: 'Filter 2.svg',
  swap: 'Swap.svg',
  location: 'Location.svg',
  discovery: 'Discovery.svg',
  category: 'Category.svg',
  activity: 'Activity.svg',
  time: 'Time Circle.svg',
  timer: 'Time Square.svg',
  game: 'Game.svg',
  chart: 'Chart.svg',
  graph: 'Graph.svg',
  scan: 'Scan.svg',
  work: 'Work.svg',
  call: 'Call.svg',
  // Arrows
  arrowLeft: 'Arrow - Left.svg',
  arrowRight: 'Arrow - Right.svg',
  arrowUp: 'Arrow - Up.svg',
  arrowDown: 'Arrow - Down.svg',
  arrowLeft2: 'Arrow - Left 2.svg',
  arrowRight2: 'Arrow - Right 2.svg',
  arrowUp2: 'Arrow - Up 2.svg',
  arrowDown2: 'Arrow - Down 2.svg',
  // Volume
  volume: 'Volume Up.svg',
  volumeMute: 'Volume Off.svg',
  volumeDown: 'Volume Down.svg',
}

const CUTE: Record<string, string> = {
  // nature & food
  sprout: '1F331',
  leaf: '1F33F',
  flower: '1F33C',
  tree: '1F332',
  wheat: '1F33E',
  salad: '1F957',
  apple: '1F34E',
  candy: '1F36C',
  carrot: '1F955',
  droplet: '1F4A7',
  droplets: '26F2',
  sun: '2600',
  moon: '1F319',
  footprints: '1F3C3',
  handshake: '1F91D',
  // places & modules
  landmark: '1F3DB',
  factory: '1F3ED',
  brick: '1F9F1',
  telescope: '1F52D',
  castle: '1F3F0',
  house: '1F3E0',
  // content objects
  rabbit: '1F430',
  brain: '1F9E0',
  gamepad: '1F3AE',
  clapperboard: '1F3AC',
  utensils: '1F37D',
  globe: '1F30D',
  gift: '1F381',
  party: '1F389',
  dice: '1F3B2',
  music: '1F3B5',
  trophy: '1F3C6',
  book: '1F4DA',
  printer: '1F5A8',
  baby: '1F476',
  megaphone: '1F4E2',
  flame: '1F525',
  sparkles: '2728',
  newspaper: '1F4F0',
  tag: '1F3F7',
  // colored UI-ish
  zap: '26A1',
  trendingUp: '1F4C8',
  clipboard: '1F4CB',
  notebookPen: '1F4DD',
  lightbulb: '1F4A1',
  mapPin: '1F4CD',
  target: '1F3AF',
  bot: '1F916',
  phone: '1F4F1',
  hash: '1F522',
  key: '1F511',
  eye: '1F440',
  monitorPlay: '1F4FA',
  wrench: '1F527',
  pin: '1F4CC',
  share: '1F4E4',
  pen: '270F',
  construction: '1F6A7',
  alert: '26A0',
  lockKeyhole: '1F510',
  starGold: '2B50',
  heart: '2764',
}

const ASSET = (code: string) => `/assets/fluent/${code}.svg`

/* Custom SVG renderer — renders the icon library SVG inline as a span so currentColor works */
function CustomIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const fname = CUSTOM[name]
  if (!fname) return null
  const raw = svgStr(fname)
  if (!raw) return null
  const html = raw.replace(/stroke-width="1\.5"/g, 'stroke-width="3.5"')
  // Wrap in a span that sets width/height + inherits color; SVG has 24×24 viewBox
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function UiIcon({ name, size = 16, className, strokeWidth = 1.8 }: {
  name: string
  size?: number
  className?: string
  strokeWidth?: number
}) {
  // 1. Custom SVG (icon library)
  if (CUSTOM[name]) return <CustomIcon name={name} size={size} className={className} />

  // 2. Cute OpenMoji
  const code = CUTE[name]
  if (code) {
    return (
      <img
        src={ASSET(code)}
        width={size}
        height={size}
        alt=""
        draggable={false}
        className={className}
      />
    )
  }

  // 3. Lucide line icons (fallback)
  const L = LINE[name]
  if (L) return <L size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />

  return null
}

const LINE: Record<string, LucideIcon> = {
  square: Square,
  checkCircle: CircleCheck,
  dropletLine: Droplet,
  saladLine: Salad,
  heartLine: Heart,
  candyLine: Candy,
  moonLine: Moon,
  footprintsLine: Footprints,
  leafLine: Leaf,
  lightbulbLine: Lightbulb,
  treeLine: TreePine,
  handshakeLine: Handshake,
  settingsLine: Settings,
  volumeLine: Volume2,
  volumeMuteLine: VolumeX,
}
