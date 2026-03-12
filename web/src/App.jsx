import React, { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Brain,
  Calendar,
  ChevronRight,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Clock,
  Coffee,
    DollarSign,
    MapPin,
    RefreshCcw,
  Trash2,
  Upload,
  Sun,
  Pencil,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { deleteDataFile, loadDataUploads, uploadDataFile } from './api/dataManagementApi'
import { loadDashboardSummary } from './api/dashboardApi'
import { loadFinanceTransactions, updateFinanceTransaction } from './api/financeApi'
import { loadTasks } from './data/taskSource'

const MELBOURNE_COORDS = {
  latitude: -37.8136,
  longitude: 144.9631,
}

const ROUTES = {
  dashboard: 'dashboard',
  executionCenter: 'execution-center',
  dataManagement: 'data-management',
  finance: 'finance',
}

const ROUTE_TRANSITION_MS = {
  exit: 180,
  enter: 320,
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '8px',
}

const AXIS_TICK_STYLE = { fill: '#64748b', fontSize: 12 }

const AREA_ANIMATION_DURATION = 3000
const BAR_ANIMATION_DURATION = 1500
const PIE_ANIMATION_DURATION = 2500
const DAY_IN_MS = 24 * 60 * 60 * 1000
const FALLBACK_NEXT_EVENT = {
  title: 'Local summary loading',
  location: 'Dashboard backend',
  time: '--:--',
  timeLeft: 'pending',
  type: 'System',
}

const EFFORT_ORDER = ['low', 'medium', 'high']

const EFFORT_META = {
  low: {
    label: 'Low',
    dotClassName: 'bg-emerald-400',
    badgeClassName: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    chipClassName: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    buttonActiveClassName: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
    buttonIdleClassName: 'border-emerald-500/15 bg-slate-900/50 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-200',
    borderClassName: 'border-l-emerald-400',
  },
  medium: {
    label: 'Medium',
    dotClassName: 'bg-amber-400',
    badgeClassName: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    chipClassName: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    buttonActiveClassName: 'border-amber-400/50 bg-amber-500/15 text-amber-300',
    buttonIdleClassName: 'border-amber-500/15 bg-slate-900/50 text-slate-400 hover:border-amber-500/30 hover:text-amber-200',
    borderClassName: 'border-l-amber-400',
  },
  high: {
    label: 'High',
    dotClassName: 'bg-rose-400',
    badgeClassName: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    chipClassName: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    buttonActiveClassName: 'border-rose-400/50 bg-rose-500/15 text-rose-300',
    buttonIdleClassName: 'border-rose-500/15 bg-slate-900/50 text-slate-400 hover:border-rose-500/30 hover:text-rose-200',
    borderClassName: 'border-l-rose-400',
  },
}

const CATEGORY_META = {
  Admin: {
    chipClassName: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    buttonActiveClassName: 'border-slate-400/50 bg-slate-500/15 text-slate-200',
    buttonIdleClassName: 'border-slate-500/20 bg-slate-900/50 text-slate-400 hover:border-slate-400/30 hover:text-slate-200',
  },
  'Career Transition': {
    chipClassName: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    buttonActiveClassName: 'border-sky-400/50 bg-sky-500/15 text-sky-200',
    buttonIdleClassName: 'border-sky-500/20 bg-slate-900/50 text-slate-400 hover:border-sky-400/30 hover:text-sky-200',
  },
  Creativity: {
    chipClassName: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
    buttonActiveClassName: 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200',
    buttonIdleClassName: 'border-fuchsia-500/20 bg-slate-900/50 text-slate-400 hover:border-fuchsia-400/30 hover:text-fuchsia-200',
  },
  Finance: {
    chipClassName: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    buttonActiveClassName: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200',
    buttonIdleClassName: 'border-cyan-500/20 bg-slate-900/50 text-slate-400 hover:border-cyan-400/30 hover:text-cyan-200',
  },
  Health: {
    chipClassName: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    buttonActiveClassName: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
    buttonIdleClassName: 'border-emerald-500/20 bg-slate-900/50 text-slate-400 hover:border-emerald-400/30 hover:text-emerald-200',
  },
  Home: {
    chipClassName: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    buttonActiveClassName: 'border-orange-400/50 bg-orange-500/15 text-orange-200',
    buttonIdleClassName: 'border-orange-500/20 bg-slate-900/50 text-slate-400 hover:border-orange-400/30 hover:text-orange-200',
  },
  Systems: {
    chipClassName: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
    buttonActiveClassName: 'border-violet-400/50 bg-violet-500/15 text-violet-200',
    buttonIdleClassName: 'border-violet-500/20 bg-slate-900/50 text-slate-400 hover:border-violet-400/30 hover:text-violet-200',
  },
}

const TASK_STATUS_META = {
  active: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  waiting: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
}

const DATA_UPLOAD_TYPES = [
  { value: 'tasks', label: 'Tasks' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Health' },
  { value: 'mood', label: 'Mood' },
]

const CSV_FORMAT_GUIDE = {
  tasks: {
    title: 'Tasks CSV',
    summary: 'Header names matter more than column order.',
    required: 'Required: `title` or `name`.',
    accepted: 'Accepted aliases: `id` / `source_record_id` / `source_id`, `summary` / `notes`, `due_date` / `due`, `source_path` / `path`.',
    exampleHeaders: 'id,title,category,effort,status,due_date,source_path,summary',
    notes: 'Valid `effort`: `low`, `medium`, `high`. Valid `status`: `ready`, `active`, `waiting`.',
  },
  finance: {
    title: 'Finance CSV',
    summary: 'Header names matter more than column order, but the app also supports the exact bank-export order from your uploaded file.',
    required: 'Required: `Date`, `Amount`, and `Transaction Details` or the normalized equivalents `date`, `amount`, `description`.',
    accepted:
      'Accepted bank-export headers: `Date`, `Amount`, `Account Number`, `Transaction Type`, `Transaction Details`, `Balance`, `Category`, `Merchant Name`, `Processed On`.',
    exampleHeaders: 'Date,Amount,Account Number,,Transaction Type,Transaction Details,Balance,Category,Merchant Name,Processed On',
    notes:
      'Dates like `12 Mar 26` are normalized automatically. `Processed On` maps to settled date, `Transaction Type` maps to subcategory, and `Account Number` maps to the source account id.',
  },
  health: {
    title: 'Health CSV',
    summary: 'Header names matter more than column order.',
    required: 'Required: `day` or `date`.',
    accepted:
      'Accepted aliases: `active_calories` / `calories`, `resting_heart_rate` / `resting_hr`, `hrv_ms` / `hrv`, `oxygen_saturation_pct` / `oxygen`.',
    exampleHeaders: 'day,steps,active_calories,resting_heart_rate,hrv_ms,sleep_minutes,workout_minutes,body_weight_kg,recovery_score,oxygen_saturation_pct',
    notes: 'One row per day. Missing numeric fields are stored as null where supported.',
  },
  mood: {
    title: 'Mood CSV',
    summary: 'Header names matter more than column order.',
    required: 'Required: `entry_at` or `timestamp`, plus `mood_score` or `mood`.',
    accepted: 'Accepted aliases: `energy_score` / `energy`, `stress_score` / `stress`, `note` / `notes`.',
    exampleHeaders: 'entry_at,mood_score,energy_score,stress_score,tags,note',
    notes: 'Tags should be pipe-delimited like `focused|creative|calm`.',
  },
}

const HASH_TO_ROUTE = {
  '#/execution-center': ROUTES.executionCenter,
  '#/data-management': ROUTES.dataManagement,
  '#/finance': ROUTES.finance,
}

const ROUTE_TO_HASH = {
  [ROUTES.dashboard]: '/',
  [ROUTES.executionCenter]: '/execution-center',
  [ROUTES.dataManagement]: '/data-management',
  [ROUTES.finance]: '/finance',
}

const getCurrentRoute = () => {
  if (typeof window === 'undefined') {
    return ROUTES.dashboard
  }

  return HASH_TO_ROUTE[window.location.hash] ?? ROUTES.dashboard
}

const getWeatherDisplay = (code) => {
  if (code === 0) {
    return { label: 'Clear', icon: Sun, iconClassName: 'text-amber-400' }
  }

  if (code === 1 || code === 2) {
    return { label: 'Partly cloudy', icon: CloudSun, iconClassName: 'text-amber-300' }
  }

  if (code === 3) {
    return { label: 'Overcast', icon: Cloud, iconClassName: 'text-slate-300' }
  }

  if (code === 45 || code === 48) {
    return { label: 'Fog', icon: CloudFog, iconClassName: 'text-slate-300' }
  }

  if (code >= 51 && code <= 57) {
    return { label: 'Drizzle', icon: CloudDrizzle, iconClassName: 'text-cyan-300' }
  }

  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: 'Rain', icon: CloudRain, iconClassName: 'text-sky-300' }
  }

  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { label: 'Snow', icon: CloudSnow, iconClassName: 'text-cyan-100' }
  }

  if (code >= 95 && code <= 99) {
    return { label: 'Thunderstorm', icon: CloudLightning, iconClassName: 'text-violet-300' }
  }

  return { label: 'Weather', icon: Cloud, iconClassName: 'text-slate-300' }
}

const getCategoryMeta = (category) =>
  CATEGORY_META[category] ?? {
    chipClassName: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    buttonActiveClassName: 'border-slate-400/50 bg-slate-500/15 text-slate-200',
    buttonIdleClassName: 'border-slate-500/20 bg-slate-900/50 text-slate-400 hover:border-slate-400/30 hover:text-slate-200',
  }

const formatTaskStatusLabel = (status) => `${status.charAt(0).toUpperCase()}${status.slice(1)}`
const formatCurrency = (value) => `$${Number(value ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const getTrendDirection = (value) => (value >= 0 ? 'up' : 'down')
const formatDirectionLabel = (direction) => `${direction.charAt(0).toUpperCase()}${direction.slice(1)}`
const DASHBOARD_ALLOCATION_MAX_CATEGORIES = 7
const FINANCE_PAGE_ALLOCATION_MAX_CATEGORIES = 21
const FINANCE_CATEGORY_COLORS = {
  Alcohol: '#ec4899',
  'Cafe & coffee': '#f59e0b',
  'Credit card repayments': '#475569',
  Donations: '#14b8a6',
  'Electronics & technology': '#7c3aed',
  Fees: '#ef4444',
  Groceries: '#10b981',
  'Internal transfers': '#eab308',
  Medical: '#22c55e',
  Media: '#a855f7',
  'Other shopping': '#8b5cf6',
  'Parking & tolls': '#f97316',
  'Personal care': '#fb7185',
  'Phone & internet': '#3b82f6',
  'Public transport': '#0ea5e9',
  'Recovery/Health': '#3b82f6',
  'Restaurants & takeaway': '#f97316',
  Rent: '#6366f1',
  Subscriptions: '#f59e0b',
  'Transfers out': '#06b6d4',
  Uncategorised: '#94a3b8',
  Discretionary: '#ef4444',
}

const groupAllocation = (allocation, maxCategories, otherColor = '#64748b') => {
  if (allocation.length <= maxCategories) {
    return allocation
  }

  const primary = allocation.slice(0, maxCategories - 1)
  const remainder = allocation.slice(maxCategories - 1)
  const otherValue = remainder.reduce((sum, category) => sum + category.value, 0)
  const otherFilterCategories = remainder.flatMap((category) => category.filterCategories ?? [category.name])

  return [
    ...primary,
    {
      name: 'Other',
      value: Number(otherValue.toFixed(2)),
      color: otherColor,
      filterCategories: otherFilterCategories,
    },
  ]
}

const groupAllocationForDashboard = (allocation) => groupAllocation(allocation, DASHBOARD_ALLOCATION_MAX_CATEGORIES)

const parseDateKey = (value) => new Date(`${value}T00:00:00`)

const getLocalDateKey = (value) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const addDaysToDateKey = (value, days) => {
  const nextDate = parseDateKey(value)
  nextDate.setDate(nextDate.getDate() + days)
  return getLocalDateKey(nextDate)
}

const clampDateKey = (value, min, max) => {
  if (value < min) {
    return min
  }

  if (value > max) {
    return max
  }

  return value
}

const getDateKeysBetween = (start, end) => {
  const values = []
  const currentDate = parseDateKey(start)
  const endDate = parseDateKey(end)

  while (currentDate <= endDate) {
    values.push(getLocalDateKey(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return values
}

const getFinancialYearStartDateKey = (value) => {
  const date = parseDateKey(value)
  const year = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1

  return `${year}-07-01`
}

const useHashRoute = () => {
  const [route, setRoute] = useState(getCurrentRoute)

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(getCurrentRoute())
    }

    window.addEventListener('hashchange', handleRouteChange)

    return () => {
      window.removeEventListener('hashchange', handleRouteChange)
    }
  }, [])

  const navigate = (nextRoute) => {
    window.location.hash = ROUTE_TO_HASH[nextRoute] ?? '/'
  }

  return { route, navigate }
}

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference)

      return () => {
        mediaQuery.removeEventListener('change', updatePreference)
      }
    }

    mediaQuery.addListener(updatePreference)

    return () => {
      mediaQuery.removeListener(updatePreference)
    }
  }, [])

  return prefersReducedMotion
}

const useRouteTransition = (route) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [displayedRoute, setDisplayedRoute] = useState(route)
  const [transitionPhase, setTransitionPhase] = useState('idle')

  useEffect(() => {
    if (route === displayedRoute) {
      return undefined
    }

    let startTimerId = 0
    let swapTimerId = 0
    let enterTimerId = 0

    if (prefersReducedMotion) {
      startTimerId = window.setTimeout(() => {
        setDisplayedRoute(route)
        setTransitionPhase('idle')
      }, 0)

      return () => {
        window.clearTimeout(startTimerId)
      }
    }

    startTimerId = window.setTimeout(() => {
      setTransitionPhase('exiting')
      swapTimerId = window.setTimeout(() => {
        setDisplayedRoute(route)
        setTransitionPhase('entering')
        enterTimerId = window.setTimeout(() => {
          setTransitionPhase('idle')
        }, ROUTE_TRANSITION_MS.enter)
      }, ROUTE_TRANSITION_MS.exit)
    }, 0)

    return () => {
      window.clearTimeout(startTimerId)
      window.clearTimeout(swapTimerId)
      window.clearTimeout(enterTimerId)
    }
  }, [displayedRoute, prefersReducedMotion, route])

  return { displayedRoute, transitionPhase }
}

const useWeather = () => {
  const [weather, setWeather] = useState({
    code: null,
    temperature: null,
    updatedAt: null,
    status: 'loading',
  })

  useEffect(() => {
    let isCancelled = false

    const loadWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${MELBOURNE_COORDS.latitude}&longitude=${MELBOURNE_COORDS.longitude}&current=temperature_2m,weather_code&timezone=Australia%2FMelbourne`
        )

        if (!response.ok) {
          throw new Error(`Weather request failed: ${response.status}`)
        }

        const data = await response.json()

        if (isCancelled) {
          return
        }

        setWeather({
          code: data.current.weather_code,
          temperature: Math.round(data.current.temperature_2m),
          updatedAt: data.current.time,
          status: 'ready',
        })
      } catch {
        if (isCancelled) {
          return
        }

        setWeather({
          code: null,
          temperature: null,
          updatedAt: null,
          status: 'error',
        })
      }
    }

    loadWeather()

    const intervalId = window.setInterval(loadWeather, 10 * 60 * 1000)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  return weather
}

const useTasks = () => {
  const [taskState, setTaskState] = useState({
    items: [],
    status: 'loading',
  })

  const refresh = async () => {
    setTaskState((current) => ({
      ...current,
      status: 'loading',
    }))

    try {
      const items = await loadTasks()
      setTaskState({
        items,
        status: 'ready',
      })
    } catch {
      setTaskState({
        items: [],
        status: 'error',
      })
    }
  }

  useEffect(() => {
    let isCancelled = false

    const fetchTasks = async () => {
      try {
        const items = await loadTasks()

        if (isCancelled) {
          return
        }

        setTaskState({
          items,
          status: 'ready',
        })
      } catch {
        if (isCancelled) {
          return
        }

        setTaskState({
          items: [],
          status: 'error',
        })
      }
    }

    fetchTasks()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    ...taskState,
    refresh,
  }
}

const useDashboardSummary = () => {
  const [dashboardState, setDashboardState] = useState({
    summary: null,
    status: 'loading',
  })

  const refresh = async () => {
    setDashboardState((current) => ({
      ...current,
      status: 'loading',
    }))

    try {
      const summary = await loadDashboardSummary()
      setDashboardState({
        summary,
        status: 'ready',
      })
    } catch {
      setDashboardState({
        summary: null,
        status: 'error',
      })
    }
  }

  useEffect(() => {
    let isCancelled = false

    const fetchSummary = async () => {
      try {
        const summary = await loadDashboardSummary()

        if (isCancelled) {
          return
        }

        setDashboardState({
          summary,
          status: 'ready',
        })
      } catch {
        if (isCancelled) {
          return
        }

        setDashboardState({
          summary: null,
          status: 'error',
        })
      }
    }

    fetchSummary()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    ...dashboardState,
    refresh,
  }
}

const useDataUploads = () => {
  const [uploadState, setUploadState] = useState({
    items: [],
    status: 'loading',
  })

  const refresh = async () => {
    setUploadState((current) => ({
      ...current,
      status: 'loading',
    }))

    try {
      const items = await loadDataUploads()
      setUploadState({
        items,
        status: 'ready',
      })
    } catch {
      setUploadState({
        items: [],
        status: 'error',
      })
    }
  }

  useEffect(() => {
    let isCancelled = false

    const fetchUploads = async () => {
      try {
        const items = await loadDataUploads()

        if (isCancelled) {
          return
        }

        setUploadState({
          items,
          status: 'ready',
        })
      } catch {
        if (isCancelled) {
          return
        }

        setUploadState({
          items: [],
          status: 'error',
        })
      }
    }

    void fetchUploads()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    ...uploadState,
    refresh,
  }
}

const useFinanceTransactions = (active) => {
  const [financeState, setFinanceState] = useState({
    items: [],
    status: 'idle',
  })

  const refresh = async () => {
    setFinanceState((current) => ({
      ...current,
      status: 'loading',
    }))

    try {
      const items = await loadFinanceTransactions({ limit: 5000 })
      setFinanceState({
        items,
        status: 'ready',
      })
    } catch {
      setFinanceState({
        items: [],
        status: 'error',
      })
    }
  }

  useEffect(() => {
    if (!active) {
      return undefined
    }

    let isCancelled = false

    const fetchTransactions = async () => {
      try {
        const items = await loadFinanceTransactions({ limit: 5000 })

        if (isCancelled) {
          return
        }

        setFinanceState({
          items,
          status: 'ready',
        })
      } catch {
        if (isCancelled) {
          return
        }

        setFinanceState({
          items: [],
          status: 'error',
        })
      }
    }

    void fetchTransactions()

    return () => {
      isCancelled = true
    }
  }, [active])

  return {
    ...financeState,
    refresh,
  }
}

const parseCsvLine = (line) => {
  const values = []
  let currentValue = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      values.push(currentValue)
      currentValue = ''
      continue
    }

    currentValue += character
  }

  values.push(currentValue)
  return values
}

const parseCsvRecords = (text) => {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)

  if (lines.length < 2) {
    return []
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((record, header, index) => {
      record[header] = (values[index] ?? '').trim()
      return record
    }, {})
  })
}

const normalizeDateValue = (value) => {
  if (!value) {
    return null
  }

  const isoMatch = value.match(/\d{4}-\d{2}-\d{2}/)
  if (isoMatch) {
    return isoMatch[0]
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

const extractDateRange = (domain, content) => {
  const records = parseCsvRecords(content)
  const dateKeys = {
    tasks: ['due_date', 'due'],
    finance: ['posted_at', 'date'],
    health: ['day', 'date'],
    mood: ['entry_at', 'timestamp'],
  }

  const dates = records
    .map((record) => {
      const key = dateKeys[domain].find((candidate) => record[candidate])
      return normalizeDateValue(key ? record[key] : '')
    })
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))

  return {
    dateRangeStart: dates[0] ?? null,
    dateRangeEnd: dates[dates.length - 1] ?? null,
  }
}

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDateLabel = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const formatDateRangeLabel = (start, end) => {
  if (!start && !end) {
    return 'No dates detected'
  }

  if (start && end && start !== end) {
    return `${formatDateLabel(start)} to ${formatDateLabel(end)}`
  }

  return formatDateLabel(start ?? end)
}

const formatFileSize = (value) => {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const VitalityChart = React.memo(function VitalityChart({ data }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK_STYLE} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} itemStyle={{ color: '#f1f5f9' }} />
          <Area
            type="monotone"
            dataKey="steps"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorSteps)"
            strokeWidth={2}
            animationDuration={AREA_ANIMATION_DURATION}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})

const CashFlowChart = React.memo(function CashFlowChart({ data }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK_STYLE} />
          <Tooltip
            cursor={{ fill: '#1e293b' }}
            contentStyle={{ backgroundColor: '#0f172a', border: 'none' }}
          />
          <Bar
            dataKey="spend"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            animationDuration={BAR_ANIMATION_DURATION}
            isAnimationActive
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

const AllocationChart = React.memo(function AllocationChart({ allocation, layout = 'side', selectedCategory = null, onCategorySelect = null }) {
  if (allocation.length === 0) {
    return (
      <div className={`flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 text-center text-sm text-slate-500 ${layout === 'stacked' ? 'h-64' : 'h-56'}`}>
        No spend categories in the selected range.
      </div>
    )
  }

  const isInteractive = typeof onCategorySelect === 'function'
  const hasSelectedCategory = selectedCategory !== null

  const stackedLegend = (
    <div className="space-y-1.5">
      {allocation.map((category) => (
        <button
          key={category.name}
          type="button"
          onClick={isInteractive ? () => onCategorySelect(category) : undefined}
          className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 rounded-xl px-2 py-1 text-left text-xs transition-colors ${
            isInteractive
              ? selectedCategory === category.name
                ? 'bg-blue-500/10 text-slate-100'
                : 'hover:bg-slate-800/70'
              : 'cursor-default'
          }`}
        >
          <div className="flex min-w-0 items-start gap-2">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
            <span className={`${selectedCategory === category.name ? 'text-slate-200' : 'text-slate-400'} min-w-0 break-words`}>
              {category.name}
            </span>
          </div>
          <span className={`whitespace-nowrap text-right font-medium ${selectedCategory === category.name ? 'text-slate-100' : 'text-slate-300'}`}>
            {formatCurrency(category.value)}
          </span>
        </button>
      ))}
    </div>
  )

  if (layout === 'stacked') {
    return (
      <div className="w-full">
        <div className="flex h-64 w-full justify-center">
          <div className="h-full w-full max-w-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={PIE_ANIMATION_DURATION}
                  isAnimationActive
                >
                  {allocation.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      fillOpacity={!hasSelectedCategory || selectedCategory === entry.name ? 1 : 0.28}
                      cursor={isInteractive ? 'pointer' : 'default'}
                      onClick={isInteractive ? () => onCategorySelect(entry) : undefined}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4">{stackedLegend}</div>
      </div>
    )
  }

  return (
    <div className="flex h-56 w-full items-center gap-4">
      <div className="h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
            data={allocation}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
            animationDuration={PIE_ANIMATION_DURATION}
            isAnimationActive
          >
            {allocation.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                fillOpacity={!hasSelectedCategory || selectedCategory === entry.name ? 1 : 0.28}
              />
            ))}
          </Pie>
          <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-[8.5rem] shrink-0 space-y-2">
        {allocation.map((category) => (
          <div key={category.name} className="flex items-start gap-2 text-xs">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="min-w-0 break-words leading-4 text-slate-400">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

const Card = ({
  title,
  icon: Icon,
  children,
  className = '',
  subtitle = '',
  onAction,
  actionLabel,
  tileIndex = 0,
}) => (
  <div
    className={`route-card rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm ${className}`}
    style={{ '--tile-index': tileIndex }}
  >
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h3 className="flex items-center gap-2 font-medium text-slate-400">
          {Icon && <Icon size={18} className="text-blue-400" />}
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          aria-label={actionLabel ?? title}
          className="text-slate-600 transition-colors hover:text-slate-400"
        >
          <ChevronRight size={20} />
        </button>
      ) : (
        <div className="text-slate-600">
          <ChevronRight size={20} />
        </div>
      )}
    </div>
    {children}
  </div>
)

const Metric = ({ label, value, unit, trend, trendValue }) => (
  <div className="flex flex-col">
    <span className="text-sm text-slate-500">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-slate-100">{value}</span>
      <span className="text-xs text-slate-500">{unit}</span>
    </div>
    {trend && (
      <span className={`mt-1 text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend === 'up' ? '↑' : '↓'} {trendValue}
      </span>
    )}
  </div>
)

const EffortBadge = ({ type, count }) => (
  <div
    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${EFFORT_META[type].badgeClassName}`}
  >
    {type} : {count}
  </div>
)

const FilterButton = ({ label, count, active, activeClassName, idleClassName, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${active ? activeClassName : idleClassName}`}
  >
    {label}
    <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">{count}</span>
  </button>
)

const TaskPreviewItem = ({ task }) => (
  <li className="flex flex-col gap-1 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 transition-colors hover:bg-slate-800/50">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-200">{task.title}</span>
      <div className={`h-2 w-2 rounded-full ${EFFORT_META[task.effort].dotClassName}`} title={`${EFFORT_META[task.effort].label} effort`} />
    </div>
    <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-500">
      <span>{task.category}</span>
      <span>•</span>
      <span>{EFFORT_META[task.effort].label} Effort</span>
    </div>
  </li>
)

const TaskDetailCard = ({ task, tileIndex = 0 }) => {
  const effortMeta = EFFORT_META[task.effort]
  const categoryMeta = getCategoryMeta(task.category)
  const statusClassName = TASK_STATUS_META[task.status] ?? TASK_STATUS_META.ready

  return (
    <article
      className={`route-card rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm`}
      style={{ '--tile-index': tileIndex }}
    >
      <div className={`mb-4 border-l-4 pl-4 ${effortMeta.borderClassName}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${effortMeta.dotClassName}`} />
              <h3 className="text-lg font-semibold text-slate-100">{task.title}</h3>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">{task.summary}</p>
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${effortMeta.chipClassName}`}
          >
            {effortMeta.label} Effort
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
        <div className={`rounded-full border px-3 py-1 ${categoryMeta.chipClassName}`}>{task.category}</div>
        <div className={`rounded-full border px-3 py-1 ${statusClassName}`}>{formatTaskStatusLabel(task.status)}</div>
        <div className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-slate-300">{task.dueLabel}</div>
      </div>

      <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{task.sourceId}</span>
        <span>{task.sourcePath}</span>
      </div>
    </article>
  )
}

const DashboardHeader = ({ weatherDisplay, weatherSummary, updatedLabel, onOpenDataManagement, dataManagementActive }) => {
  const WeatherIcon = weatherDisplay.icon

  return (
    <header className="mx-auto mb-8 flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent">
          System Integrity Dashboard
        </h1>
        <p className="mt-1 text-slate-500">Holistic Overview for Danny Holwell</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onOpenDataManagement}
          aria-label="Open Data Management"
          title="Data Management"
          className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
            dataManagementActive
              ? 'border-blue-400/40 bg-blue-500/20 text-blue-100'
              : 'border-blue-500/20 bg-blue-500/10 text-blue-300 hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-blue-200'
          }`}
        >
          <Upload size={16} />
        </button>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm">
          <div className="flex items-center gap-2 border-r border-slate-800 px-3">
            <MapPin size={16} className="text-rose-400" />
            <span>Melbourne, VIC</span>
          </div>
          <div className="flex items-center gap-2 border-r border-slate-800 px-3">
            <WeatherIcon size={16} className={weatherDisplay.iconClassName} />
            <span>{weatherSummary}</span>
          </div>
          <div className="flex items-center gap-2 px-3">
            <RefreshCcw size={16} className="text-blue-400" />
            <span>Updated {updatedLabel}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

const DashboardFooter = ({ onOpenDataManagement }) => (
  <footer className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-slate-900 pt-8 text-xs text-slate-600">
    <div>System version 2.7.0-local-first</div>
    <div className="flex gap-4">
      <a href="#" className="hover:text-slate-400">
        Settings
      </a>
      <button type="button" onClick={onOpenDataManagement} className="hover:text-slate-400">
        Data Management
      </button>
      <a href="#" className="hover:text-slate-400">
        Export Integrity Report
      </a>
    </div>
  </footer>
)

const DashboardPage = ({ tasks, taskStatus, summary, summaryStatus, onOpenExecutionCenter, onOpenFinancePage }) => {
  const taskStats = {
    low: tasks.filter((task) => task.effort === 'low').length,
    medium: tasks.filter((task) => task.effort === 'medium').length,
    high: tasks.filter((task) => task.effort === 'high').length,
  }

  const previewTasks = tasks.slice(0, 3)
  const nextEvent = summary?.nextEvent ?? FALLBACK_NEXT_EVENT
  const insights = summary?.insights ?? []
  const healthMetrics = summary?.health?.metrics ?? {
    steps: 0,
    calories: 0,
    hrv: 0,
    oxygen: 0,
    stepsTrendPercent: 0,
    hrvTrendDelta: 0,
  }
  const healthDaily = summary?.health?.daily ?? []
  const moodSummary = summary?.mood ?? {
    currentScore: 0,
    label: 'Unavailable',
    filledSegments: 0,
  }
  const financeSummary = summary?.finance ?? {
    totalBalance: 0,
    dailyBudgetLeft: 0,
    allocation: [],
    recentDailySpend: [],
  }
  const dashboardAllocation = groupAllocationForDashboard(financeSummary.allocation)
  const dashboardStateMessage =
    summaryStatus === 'loading'
      ? 'Loading local dashboard data...'
      : summaryStatus === 'error'
        ? 'Local dashboard API unavailable. Start the backend to hydrate these cards.'
        : ''

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-12">
      <div className="space-y-6 md:col-span-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card title="Vitality" icon={Activity} className="sm:col-span-2" tileIndex={0}>
            <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Metric
                label="Steps"
                value={healthMetrics.steps.toLocaleString()}
                unit="steps"
                trend={getTrendDirection(healthMetrics.stepsTrendPercent)}
                trendValue={`${Math.abs(healthMetrics.stepsTrendPercent)}%`}
              />
              <Metric label="Calories" value={healthMetrics.calories.toLocaleString()} unit="kcal" />
              <Metric
                label="HRV"
                value={healthMetrics.hrv.toLocaleString()}
                unit="ms"
                trend={getTrendDirection(healthMetrics.hrvTrendDelta)}
                trendValue={`${Math.abs(healthMetrics.hrvTrendDelta)}ms`}
              />
              <Metric label="Oxygen" value={healthMetrics.oxygen.toLocaleString()} unit="%" />
            </div>
            <VitalityChart data={healthDaily} />
            {dashboardStateMessage && <p className="mt-4 text-sm text-slate-500">{dashboardStateMessage}</p>}
          </Card>

          <Card title="Mood / Energy" icon={Brain} tileIndex={1}>
            <div className="flex h-full items-center justify-center pb-8">
              <div className="relative flex flex-col items-center">
                <div className="text-5xl font-bold text-amber-400">{moodSummary.currentScore.toFixed(1)}</div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">{moodSummary.label}</div>
                <div className="mt-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 w-6 rounded-full ${level <= moodSummary.filledSegments ? 'bg-amber-400' : 'bg-slate-800'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card title="Cash Flow" icon={Wallet} onAction={onOpenFinancePage} actionLabel="Open Finance" tileIndex={2}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Total Balance</div>
                <div className="text-3xl font-bold">{formatCurrency(financeSummary.totalBalance)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Daily Budget</div>
                <div className="text-xl font-semibold text-emerald-400">{formatCurrency(financeSummary.dailyBudgetLeft)} left</div>
              </div>
            </div>
            <CashFlowChart data={financeSummary.recentDailySpend} />
          </Card>

          <Card title="Allocation" icon={DollarSign} onAction={onOpenFinancePage} actionLabel="Open Finance" tileIndex={3}>
            <AllocationChart allocation={dashboardAllocation} />
          </Card>
        </div>
      </div>

      <div className="space-y-6 md:col-span-4">
        <div
          className="route-card group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white shadow-xl shadow-indigo-500/20"
          style={{ '--tile-index': 4 }}
        >
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-100">
              <Calendar size={14} />
              Coming Up Next
            </div>
            <h3 className="mb-1 text-lg font-bold leading-tight">{nextEvent.title}</h3>
            <div className="mt-4 flex items-center gap-4 text-sm text-indigo-100">
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>{nextEvent.time}</span>
              </div>
              <div className="rounded-lg bg-white/20 px-2 py-0.5 backdrop-blur-md">
                <span>Starts in {nextEvent.timeLeft}</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-20 transition-transform group-hover:scale-110">
            <MapPin size={80} />
          </div>
        </div>

        <Card
          title="Execution Center"
          icon={Zap}
          subtitle="Manage your daily energy budget"
          onAction={onOpenExecutionCenter}
          actionLabel="Open Execution Center"
          tileIndex={5}
        >
          <div className="mb-6 flex flex-wrap gap-2">
            <EffortBadge type="low" count={taskStatus === 'ready' ? taskStats.low : 0} />
            <EffortBadge type="medium" count={taskStatus === 'ready' ? taskStats.medium : 0} />
            <EffortBadge type="high" count={taskStatus === 'ready' ? taskStats.high : 0} />
          </div>

          {taskStatus === 'loading' && <p className="text-sm text-slate-500">Loading tasks...</p>}
          {taskStatus === 'error' && (
            <p className="text-sm text-rose-300">Task feed unavailable. The detail page is ready for an external source once connected.</p>
          )}
          {taskStatus === 'ready' && (
            <>
              <ul className="space-y-4">
                {previewTasks.map((task) => (
                  <TaskPreviewItem key={task.id} task={task} />
                ))}
              </ul>

              <button
                type="button"
                onClick={onOpenExecutionCenter}
                className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-300 transition-colors hover:text-blue-200"
              >
                View all tasks
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </Card>

        <Card title="Integrity Engine" icon={TrendingUp} tileIndex={6}>
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = insight.type === 'energy' ? Coffee : AlertCircle
              const iconClassName = insight.type === 'energy' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'

              return (
                <div key={insight.title} className="flex items-start gap-3">
                  <div className={`rounded-lg p-1.5 ${iconClassName}`}>
                    <Icon size={14} />
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    <span className="mb-0.5 block font-semibold text-slate-200">{insight.title}</span>
                    {insight.message}
                  </p>
                </div>
              )
            })}
            {insights.length === 0 && <p className="text-xs leading-relaxed text-slate-400">{dashboardStateMessage || 'No integrity insights yet.'}</p>}
          </div>
        </Card>
      </div>
    </main>
  )
}

const FinancePage = ({ summary, summaryStatus, transactions, transactionsStatus, onBackToDashboard, onUpdateTransaction }) => {
  const financeSummary = summary?.finance ?? {
    totalBalance: 0,
    dailyBudgetLeft: 0,
    allocation: [],
    recentDailySpend: [],
  }

  const [editingTransaction, setEditingTransaction] = useState(null)
  const [editForm, setEditForm] = useState({
    merchant: '',
    category: '',
  })
  const [editStatus, setEditStatus] = useState('idle')
  const [editError, setEditError] = useState('')
  const [selectedAllocationCategory, setSelectedAllocationCategory] = useState(null)
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: null,
    end: null,
  })

  const timelineDates = useMemo(() => {
    if (transactionsStatus !== 'ready' || transactions.length === 0) {
      return []
    }

    const sortedDates = [...new Set(transactions.map((transaction) => transaction.postedAt))].sort((left, right) => left.localeCompare(right))
    return getDateKeysBetween(sortedDates[0], sortedDates[sortedDates.length - 1])
  }, [transactions, transactionsStatus])

  const minAvailableDate = timelineDates[0] ?? null
  const maxAvailableDate = timelineDates[timelineDates.length - 1] ?? null
  const dateIndexByKey = useMemo(() => new Map(timelineDates.map((value, index) => [value, index])), [timelineDates])
  const referenceDate = minAvailableDate && maxAvailableDate ? clampDateKey(getLocalDateKey(new Date()), minAvailableDate, maxAvailableDate) : null

  const selectedStartDate =
    minAvailableDate && maxAvailableDate
      ? clampDateKey(selectedDateRange.start ?? minAvailableDate, minAvailableDate, maxAvailableDate)
      : null
  const selectedEndDate =
    minAvailableDate && maxAvailableDate
      ? clampDateKey(selectedDateRange.end ?? maxAvailableDate, minAvailableDate, maxAvailableDate)
      : null
  const normalizedStartDate =
    selectedStartDate && selectedEndDate && selectedStartDate > selectedEndDate ? selectedEndDate : selectedStartDate
  const normalizedEndDate =
    selectedStartDate && selectedEndDate && selectedStartDate > selectedEndDate ? selectedStartDate : selectedEndDate
  const rangeStartIndex = selectedStartDate ? (dateIndexByKey.get(selectedStartDate) ?? 0) : 0
  const rangeEndIndex = selectedEndDate ? (dateIndexByKey.get(selectedEndDate) ?? Math.max(0, timelineDates.length - 1)) : Math.max(0, timelineDates.length - 1)
  const rangeDenominator = Math.max(1, timelineDates.length - 1)
  const rangeStartPercent = (rangeStartIndex / rangeDenominator) * 100
  const rangeEndPercent = (rangeEndIndex / rangeDenominator) * 100
  const allocationColorMap = useMemo(
    () => new Map([...Object.entries(FINANCE_CATEGORY_COLORS), ...financeSummary.allocation.map((category) => [category.name, category.color])]),
    [financeSummary.allocation]
  )

  const filteredTransactions =
    !normalizedStartDate || !normalizedEndDate
      ? transactions
      : transactions.filter((transaction) => transaction.postedAt >= normalizedStartDate && transaction.postedAt <= normalizedEndDate)

  const filteredAllocation = (() => {
    const totals = new Map()

    filteredTransactions.forEach((transaction) => {
      if (transaction.direction !== 'debit' || transaction.category === 'Internal transfers') {
        return
      }

      totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount)
    })

    return [...totals.entries()]
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        color: allocationColorMap.get(name) ?? '#94a3b8',
        filterCategories: [name],
      }))
      .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
  })()
  const financePageAllocation = groupAllocation(filteredAllocation, FINANCE_PAGE_ALLOCATION_MAX_CATEGORIES)
  const activeAllocationFilter = financePageAllocation.find((category) => category.name === selectedAllocationCategory) ?? null
  const categoryFilteredTransactions =
    !activeAllocationFilter
      ? filteredTransactions
      : filteredTransactions.filter((transaction) => (activeAllocationFilter.filterCategories ?? [activeAllocationFilter.name]).includes(transaction.category))

  const latestPostedAt = transactions.length > 0 ? transactions[0].postedAt : null
  const activeRangeLabel =
    normalizedStartDate && normalizedEndDate
      ? formatDateRangeLabel(normalizedStartDate, normalizedEndDate)
      : latestPostedAt
        ? `Latest ${formatDateLabel(latestPostedAt)}`
        : 'No transactions yet'

  const applySelectedDateRange = (start, end) => {
    if (!minAvailableDate || !maxAvailableDate) {
      return
    }

    const nextStart = clampDateKey(start, minAvailableDate, maxAvailableDate)
    const nextEnd = clampDateKey(end, minAvailableDate, maxAvailableDate)

    setSelectedDateRange({
      start: nextStart <= nextEnd ? nextStart : nextEnd,
      end: nextEnd >= nextStart ? nextEnd : nextStart,
    })
  }

  const handleAllocationCategorySelect = (category) => {
    setSelectedAllocationCategory((current) => (current === category.name ? null : category.name))
  }

  const presetRanges = referenceDate
    ? [
        { label: 'Today', start: referenceDate, end: referenceDate },
        { label: 'Last 7 days', start: addDaysToDateKey(referenceDate, -6), end: referenceDate },
        { label: 'Last 30 days', start: addDaysToDateKey(referenceDate, -29), end: referenceDate },
        { label: 'Last 60 days', start: addDaysToDateKey(referenceDate, -59), end: referenceDate },
        { label: 'Financial year', start: getFinancialYearStartDateKey(referenceDate), end: referenceDate },
        { label: 'Max', start: minAvailableDate ?? referenceDate, end: maxAvailableDate ?? referenceDate },
      ]
    : []

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction)
    setEditForm({
      merchant: transaction.merchant ?? '',
      category: transaction.category ?? '',
    })
    setEditStatus('idle')
    setEditError('')
  }

  const closeEditModal = () => {
    setEditingTransaction(null)
    setEditStatus('idle')
    setEditError('')
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()

    if (!editingTransaction) {
      return
    }

    setEditStatus('saving')
    setEditError('')

    try {
      await onUpdateTransaction(editingTransaction.id, {
        merchant: editForm.merchant.trim() === '' ? null : editForm.merchant.trim(),
        category: editForm.category.trim(),
      })
      closeEditModal()
    } catch (error) {
      setEditStatus('error')
      setEditError(error instanceof Error ? error.message : 'Failed to save transaction changes')
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <button
        type="button"
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <section
        className="route-card rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm md:p-8"
        style={{ '--tile-index': 0 }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
                <Wallet size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Finance</h2>
                <p className="text-sm text-slate-500">Full transaction list from the local database</p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">
              This page reads normalized finance records from the backend API, including every imported transaction currently stored in SQLite.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Balance</div>
              <div className="mt-2 text-3xl font-bold text-slate-100">{formatCurrency(financeSummary.totalBalance)}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily Budget</div>
              <div className="mt-2 text-3xl font-bold text-emerald-300">{formatCurrency(financeSummary.dailyBudgetLeft)}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transactions</div>
              <div className="mt-2 text-3xl font-bold text-slate-100">{categoryFilteredTransactions.length}</div>
              <div className="mt-1 text-xs text-slate-500">{activeRangeLabel}</div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="route-card rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
        style={{ '--tile-index': 1 }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                <Calendar size={18} className="text-blue-400" />
                Date Range
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {presetRanges.map((preset) => {
                const isActive = preset.start === selectedStartDate && preset.end === selectedEndDate

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applySelectedDateRange(preset.start, preset.end)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                        : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {timelineDates.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-10 text-center text-sm text-slate-500">
              Upload finance data to activate the date timeline.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detected range</div>
                <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                  {activeRangeLabel}
                </div>
              </div>

              <div className="mt-4">
                <div className="relative h-8">
                  <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-800" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-500"
                    style={{
                      left: `${rangeStartPercent}%`,
                      width: `${Math.max(0, rangeEndPercent - rangeStartPercent)}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, timelineDates.length - 1)}
                    step={1}
                    value={rangeStartIndex}
                    onChange={(event) => {
                      const nextStart = timelineDates[Number(event.target.value)]
                      applySelectedDateRange(nextStart, selectedEndDate ?? nextStart)
                    }}
                    className="finance-range-slider"
                    aria-label="Start date"
                  />
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, timelineDates.length - 1)}
                    step={1}
                    value={rangeEndIndex}
                    onChange={(event) => {
                      const nextEnd = timelineDates[Number(event.target.value)]
                      applySelectedDateRange(selectedStartDate ?? nextEnd, nextEnd)
                    }}
                    className="finance-range-slider"
                    aria-label="End date"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDateLabel(minAvailableDate)}</span>
                  <span>{formatDateLabel(maxAvailableDate)}</span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Start</div>
                    <div className="mt-1 text-sm font-medium text-slate-200">{formatDateLabel(selectedStartDate)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">End</div>
                    <div className="mt-1 text-sm font-medium text-slate-200">{formatDateLabel(selectedEndDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section
          className="route-card flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
          style={{ '--tile-index': 2 }}
        >
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
              <DollarSign size={18} className="text-blue-400" />
              Allocation
            </h3>
          </div>

          <div className="flex flex-1 flex-col">
            <AllocationChart
              allocation={financePageAllocation}
              layout="stacked"
              selectedCategory={activeAllocationFilter?.name ?? null}
              onCategorySelect={handleAllocationCategorySelect}
            />
          </div>
        </section>

        <section
          className="route-card flex max-h-[70vh] min-h-[28rem] flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
          style={{ '--tile-index': 3 }}
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Transactions</h3>
              <p className="mt-1 text-sm text-slate-500">
                Filtered transaction list for the selected date range{activeAllocationFilter ? ` and ${activeAllocationFilter.name}` : ''}.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {activeAllocationFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedAllocationCategory(null)}
                  className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200 transition-colors hover:border-blue-300/40 hover:bg-blue-500/15"
                >
                  {activeAllocationFilter.name}
                </button>
              )}
              <div className="text-xs uppercase tracking-wider text-slate-500">
                {transactionsStatus === 'ready' ? `${categoryFilteredTransactions.length} rows` : 'Loading feed'}
              </div>
            </div>
          </div>

          {summaryStatus === 'error' || transactionsStatus === 'error' ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              The finance feed is unavailable. Start the local backend to restore the transaction list.
            </div>
          ) : transactionsStatus !== 'ready' ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-12 text-center text-sm text-slate-500">
              Loading transactions...
            </div>
          ) : categoryFilteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-12 text-center text-sm text-slate-500">
              No transactions fall inside the selected filters.
            </div>
          ) : (
            <>
              <div className="finance-transactions-header border-b border-slate-800">
                <div className="finance-transactions-columns pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <div className="pr-4">Posted</div>
                  <div className="pr-4">Description</div>
                  <div className="pr-4">Merchant</div>
                  <div className="pr-4">Category</div>
                  <div className="pr-4">Direction</div>
                  <div className="text-right">Amount</div>
                  <div className="pr-1 text-right">Edit</div>
                </div>
              </div>

              <div className="finance-transactions-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                <div className="text-sm">
                  {categoryFilteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="finance-transactions-columns border-b border-slate-900/80 py-4 text-slate-300">
                      <div className="pr-4 text-slate-400">{formatDateLabel(transaction.postedAt)}</div>
                      <div className="pr-4">
                        <div className="font-medium text-slate-100">{transaction.description}</div>
                        <div className="mt-1 text-xs text-slate-500">{transaction.currency}</div>
                      </div>
                      <div className="pr-4 text-slate-400">{transaction.merchant ?? 'Unassigned'}</div>
                      <div className="pr-4 text-slate-400">{transaction.category}</div>
                      <div className="pr-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                            transaction.direction === 'credit'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                              : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                          }`}
                        >
                          {formatDirectionLabel(transaction.direction)}
                        </span>
                      </div>
                      <div
                        className={`text-right font-semibold ${
                          transaction.direction === 'credit' ? 'text-emerald-300' : 'text-slate-100'
                        }`}
                      >
                        {transaction.direction === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount).replace('$', '')}
                      </div>
                      <div className="flex items-start justify-end pr-1 pt-1 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(transaction)}
                          aria-label={`Edit ${transaction.description}`}
                          title={`Edit ${transaction.description}`}
                          className="inline-flex items-start justify-end p-0 text-blue-400 transition-colors hover:text-blue-300"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </section>

      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/50">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-100">Edit Transaction</h3>
              <p className="mt-1 text-sm text-slate-500">{editingTransaction.description}</p>
            </div>

            <form className="space-y-5" onSubmit={handleEditSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Merchant</span>
                <input
                  type="text"
                  value={editForm.merchant}
                  onChange={(event) => setEditForm((current) => ({ ...current, merchant: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-blue-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Category</span>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-blue-400"
                  required
                />
              </label>

              {editError && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStatus === 'saving'}
                  className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/50"
                >
                  {editStatus === 'saving' ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

const DataManagementPage = ({ uploads, uploadsStatus, onUploadFile, onDeleteFile, onBackToDashboard }) => {
  const [selectedType, setSelectedType] = useState(DATA_UPLOAD_TYPES[0].value)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileResetKey, setFileResetKey] = useState(0)
  const [submitStatus, setSubmitStatus] = useState('idle')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const formatGuide = CSV_FORMAT_GUIDE[selectedType]

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedFile) {
      setSubmitStatus('error')
      setFeedbackMessage('Choose a CSV file before uploading.')
      return
    }

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setSubmitStatus('error')
      setFeedbackMessage('Only .csv files are supported.')
      return
    }

    setSubmitStatus('uploading')
    setFeedbackMessage('')

    try {
      const content = await selectedFile.text()
      const dateRange = extractDateRange(selectedType, content)

      const result = await onUploadFile({
        domain: selectedType,
        fileName: selectedFile.name,
        content,
        ...dateRange,
      })

      setSubmitStatus('success')
      setFeedbackMessage(
        `${selectedFile.name} imported ${result.importResult.insertedCount} row${result.importResult.insertedCount === 1 ? '' : 's'} into ${selectedType}.`
      )
      setSelectedFile(null)
      setFileResetKey((current) => current + 1)
    } catch (error) {
      setSubmitStatus('error')
      setFeedbackMessage(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    setFeedbackMessage('')

    try {
      await onDeleteFile(id)
    } catch (error) {
      setSubmitStatus('error')
      setFeedbackMessage(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <button
        type="button"
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <section
        className="route-card rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm md:p-8"
        style={{ '--tile-index': 0 }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
                <Upload size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Data Management</h2>
                <p className="text-sm text-slate-500">Upload, ingest, and manage local CSV source files</p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">
              Files uploaded here are stored in the local <code>data/imports/&lt;type&gt;/</code> folders and imported through the same local normalization pipeline used by the CLI.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tracked Files</div>
              <div className="mt-2 text-3xl font-bold text-slate-100">{uploads.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Latest Upload</div>
              <div className="mt-2 text-sm font-semibold text-slate-200">{uploads[0] ? formatDateTime(uploads[0].uploadedAt) : 'None yet'}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Storage Mode</div>
              <div className="mt-2 text-sm font-semibold text-blue-300">Local first</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div
          className="route-card rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
          style={{ '--tile-index': 1 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-100">Upload Source CSV</h3>
            <p className="mt-1 text-sm text-slate-500">Choose a data type first, then upload a `.csv` file to store and ingest it.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Upload type</span>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition-colors focus:border-blue-400"
              >
                {DATA_UPLOAD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">CSV file</span>
              <input
                key={fileResetKey}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/80 px-4 py-4 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-blue-500/15 file:px-4 file:py-2 file:font-semibold file:text-blue-200 hover:border-slate-600"
              />
            </label>

            <button
              type="submit"
              disabled={submitStatus === 'uploading'}
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/50"
            >
              <Upload size={16} />
              {submitStatus === 'uploading' ? 'Uploading...' : 'Upload CSV'}
            </button>
          </form>

          {feedbackMessage && (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                submitStatus === 'error'
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-200'
                  : 'border-blue-500/20 bg-blue-500/10 text-blue-100'
              }`}
            >
              {feedbackMessage}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{formatGuide.title}</div>
            <p className="mt-2 text-sm text-slate-400">{formatGuide.summary}</p>
            <p className="mt-3 text-sm text-slate-300">{formatGuide.required}</p>
            <p className="mt-2 text-sm text-slate-400">{formatGuide.accepted}</p>
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Example headers</div>
              <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 text-xs text-blue-100">
                <code>{formatGuide.exampleHeaders}</code>
              </pre>
            </div>
            <p className="mt-3 text-sm text-slate-400">{formatGuide.notes}</p>
          </div>
        </div>

        <div
          className="route-card rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
          style={{ '--tile-index': 2 }}
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Uploaded Files</h3>
              <p className="mt-1 text-sm text-slate-500">Previously uploaded CSV files tracked by the local app.</p>
            </div>
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {uploadsStatus === 'loading' ? 'Loading files...' : `${uploads.length} file${uploads.length === 1 ? '' : 's'}`}
            </div>
          </div>

          {uploadsStatus === 'error' && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              Uploaded files could not be loaded from the local API.
            </div>
          )}

          {uploadsStatus !== 'error' && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">File name</th>
                    <th className="pb-3 pr-4 font-semibold">Data type</th>
                    <th className="pb-3 pr-4 font-semibold">Uploaded</th>
                    <th className="pb-3 pr-4 font-semibold">Date range</th>
                    <th className="pb-3 pr-4 font-semibold">Size</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.length > 0 ? (
                    uploads.map((upload) => (
                      <tr key={upload.id} className="border-b border-slate-900/80 text-slate-300">
                        <td className="py-4 pr-4">
                          <div className="font-medium text-slate-100">{upload.fileName}</div>
                          <div className="mt-1 text-xs text-slate-500">{upload.storedFileName}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
                            {upload.dataType}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-400">{formatDateTime(upload.uploadedAt)}</td>
                        <td className="py-4 pr-4 text-slate-400">{formatDateRangeLabel(upload.dateRangeStart, upload.dateRangeEnd)}</td>
                        <td className="py-4 pr-4 text-slate-400">{formatFileSize(upload.fileSizeBytes)}</td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(upload.id)}
                            disabled={deletingId === upload.id}
                            aria-label={`Delete ${upload.fileName}`}
                            title={`Delete ${upload.fileName}`}
                            className="inline-flex h-9 w-9 items-center justify-center text-rose-400 transition-colors hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                        {uploadsStatus === 'loading' ? 'Loading uploads...' : 'No CSV files have been uploaded yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

const ExecutionCenterPage = ({ tasks, taskStatus, onBackToDashboard }) => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeEffort, setActiveEffort] = useState('all')

  const categories = [...new Set(tasks.map((task) => task.category))].sort((left, right) => left.localeCompare(right))
  const filteredTasks = tasks.filter((task) => {
    const categoryMatch = activeCategory === 'all' || task.category === activeCategory
    const effortMatch = activeEffort === 'all' || task.effort === activeEffort

    return categoryMatch && effortMatch
  })

  const readyCount = tasks.filter((task) => task.status === 'ready').length
  const activeCount = tasks.filter((task) => task.status === 'active').length
  const waitingCount = tasks.filter((task) => task.status === 'waiting').length

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <button
        type="button"
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <section
        className="route-card rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm md:p-8"
        style={{ '--tile-index': 0 }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
                <Zap size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Execution Center</h2>
                <p className="text-sm text-slate-500">Manage your daily energy budget</p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">
              This page now reads normalized task records through the frontend API boundary, so the UI stays decoupled from SQLite, CSV imports, and future source adapters.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {EFFORT_ORDER.map((effort) => (
              <EffortBadge key={effort} type={effort} count={tasks.filter((task) => task.effort === effort).length} />
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div
            className="route-card rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            style={{ '--tile-index': 1 }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ready to Execute</div>
            <div className="mt-2 text-3xl font-bold text-emerald-300">{readyCount}</div>
          </div>
          <div
            className="route-card rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            style={{ '--tile-index': 2 }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">In Motion</div>
            <div className="mt-2 text-3xl font-bold text-blue-300">{activeCount}</div>
          </div>
          <div
            className="route-card rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            style={{ '--tile-index': 3 }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Waiting / Deferred</div>
            <div className="mt-2 text-3xl font-bold text-amber-300">{waitingCount}</div>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Filter by Category</div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="All Categories"
                count={tasks.length}
                active={activeCategory === 'all'}
                activeClassName="border-blue-400/50 bg-blue-500/15 text-blue-200"
                idleClassName="border-slate-700 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                onClick={() => setActiveCategory('all')}
              />
              {categories.map((category) => {
                const categoryMeta = getCategoryMeta(category)
                const count = tasks.filter((task) => task.category === category).length

                return (
                  <FilterButton
                    key={category}
                    label={category}
                    count={count}
                    active={activeCategory === category}
                    activeClassName={categoryMeta.buttonActiveClassName}
                    idleClassName={categoryMeta.buttonIdleClassName}
                    onClick={() => setActiveCategory(category)}
                  />
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Filter by Effort</div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="All Effort"
                count={tasks.length}
                active={activeEffort === 'all'}
                activeClassName="border-blue-400/50 bg-blue-500/15 text-blue-200"
                idleClassName="border-slate-700 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                onClick={() => setActiveEffort('all')}
              />
              {EFFORT_ORDER.map((effort) => (
                <FilterButton
                  key={effort}
                  label={EFFORT_META[effort].label}
                  count={tasks.filter((task) => task.effort === effort).length}
                  active={activeEffort === effort}
                  activeClassName={EFFORT_META[effort].buttonActiveClassName}
                  idleClassName={EFFORT_META[effort].buttonIdleClassName}
                  onClick={() => setActiveEffort(effort)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {taskStatus === 'loading' && (
        <section
          className="route-card rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400"
          style={{ '--tile-index': 4 }}
        >
          Loading task feed...
        </section>
      )}

      {taskStatus === 'error' && (
        <section
          className="route-card rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200"
          style={{ '--tile-index': 4 }}
        >
          The task feed failed to load. Start the local backend to restore the task source.
        </section>
      )}

      {taskStatus === 'ready' && (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <TaskDetailCard key={task.id} task={task} tileIndex={Math.min(index + 4, 8)} />
              ))
            ) : (
              <div
                className="route-card rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400"
                style={{ '--tile-index': 4 }}
              >
                No tasks match the selected category and effort filters.
              </div>
            )}
          </div>

          <aside
            className="route-card rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
            style={{ '--tile-index': 5 }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Zap size={16} className="text-blue-300" />
              Execution Snapshot
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <div className="text-slate-500">Visible tasks</div>
                <div className="mt-1 text-3xl font-bold text-slate-100">{filteredTasks.length}</div>
              </div>
              <div>
                <div className="text-slate-500">Source model</div>
                <p className="mt-1 leading-relaxed text-slate-400">
                  Normalized task records exposed by the local API. Replace the current ingest or source adapters without rewriting the UI.
                </p>
              </div>
              <div>
                <div className="text-slate-500">Current filter</div>
                <p className="mt-1 leading-relaxed text-slate-400">
                  {activeCategory === 'all' ? 'All categories' : activeCategory}
                  {' · '}
                  {activeEffort === 'all' ? 'All effort levels' : `${EFFORT_META[activeEffort].label} effort`}
                </p>
              </div>
            </div>
          </aside>
        </section>
      )}
    </main>
  )
}

const App = () => {
  const { route, navigate } = useHashRoute()
  const { displayedRoute, transitionPhase } = useRouteTransition(route)
  const weather = useWeather()
  const { summary, status: summaryStatus, refresh: refreshSummary } = useDashboardSummary()
  const { items: tasks, status: taskStatus, refresh: refreshTasks } = useTasks()
  const { items: uploads, status: uploadsStatus, refresh: refreshUploads } = useDataUploads()
  const { items: financeTransactions, status: financeTransactionsStatus, refresh: refreshFinanceTransactions } = useFinanceTransactions(route === ROUTES.finance)

  const weatherDisplay = getWeatherDisplay(weather.code)
  const weatherSummary =
    weather.status === 'error'
      ? 'Weather unavailable'
      : weather.temperature === null
        ? 'Loading weather...'
        : `${weather.temperature}°C ${weatherDisplay.label}`
  const updatedLabel = weather.updatedAt
    ? new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'pending'

  const handleUploadFile = async (payload) => {
    const result = await uploadDataFile(payload)
    await Promise.all([refreshUploads(), refreshSummary(), refreshTasks()])
    return result
  }

  const handleDeleteFile = async (id) => {
    await deleteDataFile(id)
    await refreshUploads()
  }

  const handleUpdateFinanceTransaction = async (id, payload) => {
    const result = await updateFinanceTransaction(id, payload)
    await Promise.all([refreshSummary(), refreshFinanceTransactions()])
    return result
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans text-slate-200 selection:bg-blue-500/30 md:p-8">
      <DashboardHeader
        weatherDisplay={weatherDisplay}
        weatherSummary={weatherSummary}
        updatedLabel={updatedLabel}
        onOpenDataManagement={() => navigate(ROUTES.dataManagement)}
        dataManagementActive={route === ROUTES.dataManagement}
      />

      <div className={`route-transition route-transition--${transitionPhase}`}>
        <div key={displayedRoute} className="route-transition__page">
          {displayedRoute === ROUTES.executionCenter ? (
            <ExecutionCenterPage tasks={tasks} taskStatus={taskStatus} onBackToDashboard={() => navigate(ROUTES.dashboard)} />
          ) : displayedRoute === ROUTES.finance ? (
            <FinancePage
              summary={summary}
              summaryStatus={summaryStatus}
              transactions={financeTransactions}
              transactionsStatus={financeTransactionsStatus}
              onBackToDashboard={() => navigate(ROUTES.dashboard)}
              onUpdateTransaction={handleUpdateFinanceTransaction}
            />
          ) : displayedRoute === ROUTES.dataManagement ? (
            <DataManagementPage
              uploads={uploads}
              uploadsStatus={uploadsStatus}
              onUploadFile={handleUploadFile}
              onDeleteFile={handleDeleteFile}
              onBackToDashboard={() => navigate(ROUTES.dashboard)}
            />
          ) : (
            <DashboardPage
              tasks={tasks}
              taskStatus={taskStatus}
              summary={summary}
              summaryStatus={summaryStatus}
              onOpenExecutionCenter={() => navigate(ROUTES.executionCenter)}
              onOpenFinancePage={() => navigate(ROUTES.finance)}
            />
          )}
        </div>
      </div>

      <DashboardFooter onOpenDataManagement={() => navigate(ROUTES.dataManagement)} />
    </div>
  )
}

export default App
