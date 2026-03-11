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

const MELBOURNE_COORDS = {
  latitude: -37.8136,
  longitude: 144.9631,
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

const AREA_ANIMATION_DURATION = 1500
const BAR_ANIMATION_DURATION = 400
const PIE_ANIMATION_DURATION = 1500

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
        {FINANCIAL_CATEGORIES.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
            <span className="text-slate-400">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

const Card = ({ title, icon: Icon, children, className = '', subtitle = '' }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm ${className}`}>
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h3 className="flex items-center gap-2 font-medium text-slate-400">
          {Icon && <Icon size={18} className="text-blue-400" />}
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <button className="text-slate-600 transition-colors hover:text-slate-400">
        <ChevronRight size={20} />
      </button>
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

const EffortBadge = ({ type, count }) => {
  const colors = {
    low: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    medium: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    high: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  }

  return (
    <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${colors[type]}`}>
      {type} : {count}
    </div>
  )
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

const App = () => {
  const [weather, setWeather] = useState({
    code: null,
    temperature: null,
    updatedAt: null,
    status: 'loading',
  })

  const taskStats = {
    low: 5,
    medium: 3,
    high: 2,
  }

  const nextEvent = {
    title: 'Physiotherapy - Mobility Check',
    location: 'Moonee Ponds Clinic',
    time: '2:30 PM',
    timeLeft: '45 mins',
    type: 'Health',
  }

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

    const intervalId = setInterval(loadWeather, 10 * 60 * 1000)

    return () => {
      isCancelled = true
      clearInterval(intervalId)
    }
  }, [])

  const weatherDisplay = getWeatherDisplay(weather.code)
  const WeatherIcon = weatherDisplay.icon
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

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-12">
        <div className="space-y-6 md:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card title="Vitality" icon={Activity} className="sm:col-span-2">
              <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                <Metric label="Steps" value="8,402" unit="steps" trend="up" trendValue="12%" />
                <Metric label="Calories" value="2,140" unit="kcal" />
                <Metric label="HRV" value="62" unit="ms" trend="up" trendValue="5ms" />
                <Metric label="Oxygen" value="98" unit="%" />
              </div>
              <VitalityChart />
            </Card>

            <Card title="Mood / Energy" icon={Brain}>
              <div className="flex h-full items-center justify-center pb-8">
                <div className="relative flex flex-col items-center">
                  <div className="text-5xl font-bold text-amber-400">7.2</div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
                    Elevated
                  </div>
                  <div className="mt-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-6 rounded-full ${i <= 4 ? 'bg-amber-400' : 'bg-slate-800'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card title="Cash Flow" icon={Wallet}>
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

            <Card title="Allocation" icon={DollarSign}>
              <AllocationChart />
            </Card>
          </div>
        </div>

        <div className="space-y-6 md:col-span-4">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white shadow-xl shadow-indigo-500/20">
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

          <Card title="Execution Center" icon={Zap} subtitle="Manage your daily energy budget">
            <div className="mb-6 flex flex-wrap gap-2">
              <EffortBadge type="low" count={taskStats.low} />
              <EffortBadge type="medium" count={taskStats.medium} />
              <EffortBadge type="high" count={taskStats.high} />
            </div>

            <ul className="space-y-4">
              <li className="group flex cursor-pointer flex-col gap-1 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 transition-colors hover:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">Update CV for NAB G4 Role</span>
                  <div className="h-2 w-2 rounded-full bg-rose-500" title="High Effort" />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-500">
                  <span>Career Transition</span>
                  <span>•</span>
                  <span>High Effort</span>
                </div>
              </li>

              <li className="flex cursor-pointer flex-col gap-1 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 transition-colors hover:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">Finalise Dichotomy Card Backs</span>
                  <div className="h-2 w-2 rounded-full bg-amber-500" title="Medium Effort" />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-500">
                  <span>Creativity</span>
                  <span>•</span>
                  <span>Medium Effort</span>
                </div>
              </li>

              <li className="flex cursor-pointer flex-col gap-1 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3 transition-colors hover:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">Submit Health Rebate</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500" title="Low Effort" />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-500">
                  <span>Admin</span>
                  <span>•</span>
                  <span>Low Effort</span>
                </div>
              </li>
            </ul>
          </Card>

          <Card title="Integrity Engine" icon={TrendingUp}>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400">
                  <Coffee size={14} />
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  <span className="mb-0.5 block font-semibold text-slate-200">Energy/Effort Match</span>
                  Today&apos;s mood (7.2) is ideal for tackling your 1 &quot;High Effort&quot; task before
                  11:00 AM.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-400">
                  <AlertCircle size={14} />
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  <span className="mb-0.5 block font-semibold text-slate-200">Reward Seek Trigger</span>
                  Low step count detected (8,402 vs 10k target). Watch for impulsive &quot;add to cart&quot;
                  urges this evening.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

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
    </div>
  )
}

export default App
