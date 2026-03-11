import React, { useEffect, useState } from 'react'
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
  Sun,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { loadTasks } from './data/taskSource'

const MELBOURNE_COORDS = {
  latitude: -37.8136,
  longitude: 144.9631,
}

const ROUTES = {
  dashboard: 'dashboard',
  executionCenter: 'execution-center',
}

const ROUTE_TRANSITION_MS = {
  exit: 180,
  enter: 320,
}

const HEALTH_DATA = [
  { day: 'Mon', steps: 6200, calories: 2100, hr: 62, hrv: 55, mood: 6, spend: 45 },
  { day: 'Tue', steps: 8400, calories: 2350, hr: 58, hrv: 62, mood: 8, spend: 20 },
  { day: 'Wed', steps: 3100, calories: 1800, hr: 68, hrv: 45, mood: 4, spend: 120 },
  { day: 'Thu', steps: 7800, calories: 2200, hr: 60, hrv: 58, mood: 7, spend: 15 },
  { day: 'Fri', steps: 9200, calories: 2500, hr: 55, hrv: 70, mood: 9, spend: 30 },
  { day: 'Sat', steps: 5500, calories: 2000, hr: 64, hrv: 52, mood: 5, spend: 85 },
  { day: 'Sun', steps: 4200, calories: 1900, hr: 61, hrv: 50, mood: 6, spend: 40 },
]

const FINANCIAL_CATEGORIES = [
  { name: 'Groceries', value: 450, color: '#10b981' },
  { name: 'Recovery/Health', value: 300, color: '#3b82f6' },
  { name: 'Rent', value: 1200, color: '#6366f1' },
  { name: 'Subscriptions', value: 80, color: '#f59e0b' },
  { name: 'Discretionary', value: 250, color: '#ef4444' },
]

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '8px',
}

const AXIS_TICK_STYLE = { fill: '#64748b', fontSize: 12 }

const AREA_ANIMATION_DURATION = 3000
const BAR_ANIMATION_DURATION = 1500
const PIE_ANIMATION_DURATION = 2500

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

const getCurrentRoute = () => {
  if (typeof window === 'undefined') {
    return ROUTES.dashboard
  }

  return window.location.hash === '#/execution-center' ? ROUTES.executionCenter : ROUTES.dashboard
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
    window.location.hash = nextRoute === ROUTES.executionCenter ? '/execution-center' : '/'
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

  return taskState
}

const VitalityChart = React.memo(function VitalityChart() {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={HEALTH_DATA}>
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

const CashFlowChart = React.memo(function CashFlowChart() {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={HEALTH_DATA}>
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

const AllocationChart = React.memo(function AllocationChart() {
  return (
    <div className="flex h-56 w-full items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={FINANCIAL_CATEGORIES}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationDuration={PIE_ANIMATION_DURATION}
            isAnimationActive
          >
            {FINANCIAL_CATEGORIES.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2">
        {FINANCIAL_CATEGORIES.map((category) => (
          <div key={category.name} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="text-slate-400">{category.name}</span>
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

const DashboardHeader = ({ weatherDisplay, weatherSummary, updatedLabel }) => {
  const WeatherIcon = weatherDisplay.icon

  return (
    <header className="mx-auto mb-8 flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent">
          System Integrity Dashboard
        </h1>
        <p className="mt-1 text-slate-500">Holistic Overview for Danny Holwell</p>
      </div>

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
    </header>
  )
}

const DashboardFooter = () => (
  <footer className="mx-auto mt-12 flex max-w-7xl items-center justify-between border-t border-slate-900 pt-8 text-xs text-slate-600">
    <div>System version 2.6.1-Executive-Control</div>
    <div className="flex gap-4">
      <a href="#" className="hover:text-slate-400">
        Settings
      </a>
      <a href="#" className="hover:text-slate-400">
        Data Sources
      </a>
      <a href="#" className="hover:text-slate-400">
        Export Integrity Report
      </a>
    </div>
  </footer>
)

const DashboardPage = ({ tasks, taskStatus, nextEvent, onOpenExecutionCenter }) => {
  const taskStats = {
    low: tasks.filter((task) => task.effort === 'low').length,
    medium: tasks.filter((task) => task.effort === 'medium').length,
    high: tasks.filter((task) => task.effort === 'high').length,
  }

  const previewTasks = tasks.slice(0, 3)

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-12">
      <div className="space-y-6 md:col-span-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card title="Vitality" icon={Activity} className="sm:col-span-2" tileIndex={0}>
            <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Metric label="Steps" value="8,402" unit="steps" trend="up" trendValue="12%" />
              <Metric label="Calories" value="2,140" unit="kcal" />
              <Metric label="HRV" value="62" unit="ms" trend="up" trendValue="5ms" />
              <Metric label="Oxygen" value="98" unit="%" />
            </div>
            <VitalityChart />
          </Card>

          <Card title="Mood / Energy" icon={Brain} tileIndex={1}>
            <div className="flex h-full items-center justify-center pb-8">
              <div className="relative flex flex-col items-center">
                <div className="text-5xl font-bold text-amber-400">7.2</div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">Elevated</div>
                <div className="mt-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 w-6 rounded-full ${level <= 4 ? 'bg-amber-400' : 'bg-slate-800'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card title="Cash Flow" icon={Wallet} tileIndex={2}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Total Balance</div>
                <div className="text-3xl font-bold">$12,450.00</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Daily Budget</div>
                <div className="text-xl font-semibold text-emerald-400">$42.10 left</div>
              </div>
            </div>
            <CashFlowChart />
          </Card>

          <Card title="Allocation" icon={DollarSign} tileIndex={3}>
            <AllocationChart />
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
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400">
                <Coffee size={14} />
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="mb-0.5 block font-semibold text-slate-200">Energy/Effort Match</span>
                Today&apos;s mood (7.2) is ideal for tackling your 1 &quot;High Effort&quot; task before 11:00 AM.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-400">
                <AlertCircle size={14} />
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="mb-0.5 block font-semibold text-slate-200">Reward Seek Trigger</span>
                Low step count detected (8,402 vs 10k target). Watch for impulsive &quot;add to cart&quot; urges this evening.
              </p>
            </div>
          </div>
        </Card>
      </div>
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
              This page is wired to an async task source instead of hardcoded page state, so the UI can later swap to a JSON export, local service, or vault sync pipeline without changing the filtering or layout logic.
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
          The task feed failed to load. The page is ready for an external source, but the current provider did not return data.
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
                  Normalized task records with category and effort metadata. Replace the current provider with a vault export or local API when you are ready.
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
  const { items: tasks, status: taskStatus } = useTasks()

  const nextEvent = {
    title: 'Physiotherapy - Mobility Check',
    location: 'Moonee Ponds Clinic',
    time: '2:30 PM',
    timeLeft: '45 mins',
    type: 'Health',
  }

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

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans text-slate-200 selection:bg-blue-500/30 md:p-8">
      <DashboardHeader weatherDisplay={weatherDisplay} weatherSummary={weatherSummary} updatedLabel={updatedLabel} />

      <div className={`route-transition route-transition--${transitionPhase}`}>
        <div key={displayedRoute} className="route-transition__page">
          {displayedRoute === ROUTES.executionCenter ? (
            <ExecutionCenterPage tasks={tasks} taskStatus={taskStatus} onBackToDashboard={() => navigate(ROUTES.dashboard)} />
          ) : (
            <DashboardPage
              tasks={tasks}
              taskStatus={taskStatus}
              nextEvent={nextEvent}
              onOpenExecutionCenter={() => navigate(ROUTES.executionCenter)}
            />
          )}
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}

export default App
