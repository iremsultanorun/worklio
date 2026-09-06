import {
  BellRing,
  Wallet,
  CreditCard,
  Flag,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { cash, goals, notes, payments, reminders } from '../../lib/api'
import { Cash, Goal, Note, Payment, Reminder } from '../../lib/types'

type SummaryCard = {
  icon: React.ElementType
  label: string
  labelColor: string
  title: string
  value: string | number
  href: string
}

function SummaryCardItem({ icon: Icon, label, labelColor, title, value, href }: SummaryCard) {
  return (
    <Link href={href} className="bg-white shadow-sm rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon size={18} className="text-gray-600" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${labelColor}`}>
          {label}
        </span>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  )
}

type GoalProgress = { title: string; percentage: number; color: string}

function GoalProgressBar({ title, percentage, color,  }: GoalProgress) {
  return (
    <div  className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">{title}</span>
        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default async function Dashboard() {
  const [remindersData, cashData, paymentsData, goalsData, notesData] = await Promise.all([
    reminders(),
    cash(),
    payments(),
    goals(),
    notes(),
  ])

  const today = new Date().toISOString().split('T')[0]
  const todayReminders = (remindersData as Reminder[]).filter(
    (r) => r.date === today && !r.is_completed
  )

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyTotal = (cashData as Cash[])
    .filter((c) => c.date?.startsWith(currentMonth))
    .reduce((sum: number, c) => sum + c.amount, 0)

  const pendingPayments = (paymentsData as Payment[]).filter((p) => !p.is_paid)
  const activeGoals = (goalsData as Goal[]).filter((g) => !g.is_completed)

  const upcomingPayments = [...(pendingPayments as Payment[])]
    .sort((a, b) => new Date(a.due_date ?? '').getTime() - new Date(b.due_date ?? '').getTime())
    .slice(0, 3)

  const goalProgressData = (goalsData as Goal[]).map((g) => ({
    title: g.goal_name,
    percentage: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
    color: 'bg-violet-600',
  }))

  const priorityOrder: Record<string, number> = { critical: 0, medium: 1, low: 2 }
  const featuredNotes = [...(notesData as Note[])]
    .sort((a, b) => (priorityOrder[a.importance] ?? 3) - (priorityOrder[b.importance] ?? 3))
    .slice(0, 3)

  const summaryCards: SummaryCard[] = [
    {
      icon: BellRing,
      label: 'Bugün',
      labelColor: 'bg-violet-100 text-violet-600',
      title: 'Bugünün Hatırlatıcıları',
      value: todayReminders.length,
      href: '/reminders',
    },
    {
      icon: Wallet,
      label: 'Bu Ay',
      labelColor: 'bg-gray-800 text-white',
      title: 'Aylık Kasa Toplamı',
      value: `₺${monthlyTotal.toLocaleString('tr-TR')}`,
      href: '/cash',
    },
    {
      icon: CreditCard,
      label: 'Bekliyor',
      labelColor: 'bg-red-100 text-red-600',
      title: 'Bekleyen Ödemeler',
      value: pendingPayments.length,
      href: '/payments',
    },
    {
      icon: Flag,
      label: 'Devam Ediyor',
      labelColor: 'bg-amber-100 text-amber-600',
      title: 'Aktif Hedefler',
      value: activeGoals.length,
      href: '/goals',
    },
  ]

  const importanceBorder: Record<string, string> = {
    critical: 'border-red-400',
    medium: 'border-amber-400',
    low: 'border-gray-300',
  }

  return (
    <div className="p-4 flex flex-col gap-6 bg-transparent min-h-screen">

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <SummaryCardItem key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 bg-white shadow-sm rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 mb-4">Yaklaşan Ödemeler</h2>
            <Link href="/payments" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-4 bg-gray-50 py-2 text-xs text-gray-500 uppercase tracking-wide px-1">
            <span className="col-span-1">Ödeme</span>
            <span>Tarih</span>
            <span>Tutar</span>
            <span>Durum</span>
          </div>

          <div className="flex flex-col gap-2">
            {upcomingPayments.length === 0 ? (
              <p className="text-sm text-gray-400 px-1 py-3">Bekleyen ödeme yok.</p>
            ) : (
              upcomingPayments.map((payment) => (
                <div key={payment.id} className="grid grid-cols-4 items-center px-1 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-gray-900">{payment.payment_name}</p>
                    <p className="text-xs text-gray-400">{payment.category}</p>
                  </div>
                  <span className="text-sm text-gray-600">{payment.due_date}</span>
                  <span className="text-sm font-medium text-gray-900">₺{payment.amount?.toLocaleString('tr-TR')}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full w-fit bg-amber-100 text-amber-600">
                    BEKLİYOR
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">

          <div className="bg-white shadow-sm rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-violet-600" />
              <h2 className="font-semibold text-gray-900">Hedef İlerlemesi</h2>
            </div>
            <div className="flex flex-col gap-4">
              {goalProgressData.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz hedef yok.</p>
              ) : (
                goalProgressData.map((goal) => (
                  <GoalProgressBar key={goal.title} {...goal} />
                ))
              )}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Öne Çıkan Notlar</h2>
              <Link href="/notes" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
                Tümü <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {featuredNotes.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz not yok.</p>
              ) : (
                featuredNotes.map((note) => (
                  <div key={note.id} className={`border-l-4 ${importanceBorder[note.importance] ?? 'border-gray-300'} bg-gray-50 rounded-r-xl px-3 py-2`}>
                    <p className="text-sm font-medium text-gray-900">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}