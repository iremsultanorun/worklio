'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, CreditCard, X, Wallet, AlertCircle, MoveDown, CircleCheck, Search } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type Payment = {
  id: number
  payment_name: string
  amount: number
  due_date: string
  category: string
  is_paid: number
}

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const emptyForm = {
  payment_name: '',
  amount: '',
  due_date: getTomorrow(),
  category: '',
  is_paid: 0,
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parseAmountInput(value: string) {
  return Number(value.replace(/\./g, ''))
}

export default function PaymentsPage() {
  const [paymentList, setPaymentList] = useState<Payment[]>([])
  const [cashList, setCashList] = useState<{ amount: number }[]>([])
  const [form, setForm] = useState(emptyForm)
  const [amountDisplay, setAmountDisplay] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [updateAmount, setUpdateAmount] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')

  async function fetchData() {
    try {
      const [payRes, cashRes] = await Promise.all([
        fetch(`${BASE_URL}/payments`, { cache: 'no-store' }),
        fetch(`${BASE_URL}/cash`, { cache: 'no-store' })
      ])
      const payData = await payRes.json()
      const cashData = await cashRes.json()

      setPaymentList(payData)
      setCashList(cashData)
    } catch (error) {
      console.error("Veri çekilirken hata oluştu:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]

    const totalAll = paymentList.reduce((s, p) => s + p.amount, 0)
    const totalPaid = paymentList.filter(p => p.is_paid).reduce((s, p) => s + p.amount, 0)
    const totalPending = paymentList.filter(p => !p.is_paid).reduce((s, p) => s + p.amount, 0)

    const totalOverdue = paymentList
      .filter(p => !p.is_paid && p.due_date < todayStr)
      .reduce((s, p) => s + p.amount, 0)

    const cashTotal = cashList.reduce((s, c) => s + c.amount, 0)
    const netBalance = cashTotal - totalPaid

    return { totalAll, totalPaid, totalPending, totalOverdue, netBalance }
  }, [paymentList, cashList])

  const filteredAndSortedList = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]

    return paymentList
      .filter(p => p.payment_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .filter(p => {
        if (activeTab === 'pending') return !p.is_paid && p.due_date >= todayStr
        if (activeTab === 'overdue') return !p.is_paid && p.due_date < todayStr
        if (activeTab === 'paid') return p.is_paid === 1
        return true
      })
      .sort((a, b) => {
        if (a.is_paid !== b.is_paid) return a.is_paid - b.is_paid
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
  }, [paymentList, debouncedSearch, activeTab])



  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setAmountDisplay('')
    setFormError(null)
  }

  async function handleSave() {
    if (!form.payment_name.trim() || !amountDisplay.trim() || !form.due_date) {
      setFormError('Lütfen zorunlu alanları (ödeme adı, tutar, tarih) doldurun.')
      return
    }
    const amountValue = parseAmountInput(amountDisplay)
    if (!amountValue || amountValue <= 0) {
      setFormError('Geçerli bir tutar girin.')
      return
    }
    setFormError(null)

    const body = {
      payment_name: form.payment_name.trim(),
      amount: amountValue,
      due_date: form.due_date,
      category: form.category.trim(),
      is_paid: form.is_paid,
    }

    const url = editingId ? `${BASE_URL}/payments/${editingId}` : `${BASE_URL}/payments`
    const method = editingId ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    fetchData()
  }

  async function togglePaid(p: Payment) {
    await fetch(`${BASE_URL}/payments/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, is_paid: p.is_paid ? 0 : 1 }),
    })
    fetchData()
  }

  function handleEdit(p: Payment) {
    setForm({
      payment_name: p.payment_name,
      amount: String(p.amount),
      due_date: p.due_date,
      category: p.category ?? '',
      is_paid: p.is_paid,
    })
    setAmountDisplay(formatAmountInput(String(p.amount)))
    setEditingId(p.id)
    setFormError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: number) {
    await fetch(`${BASE_URL}/payments/${id}`, { method: 'DELETE' })
    setDeleteConfirmId(null)
    fetchData()
  }

  async function handlePartialPayment(p: Payment) {
    const paidNow = parseAmountInput(updateAmount)
    if (!paidNow || paidNow <= 0) return

    const remaining = Math.max(p.amount - paidNow, 0)
    const isFullyPaid = remaining === 0

    await fetch(`${BASE_URL}/payments/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, amount: remaining, is_paid: isFullyPaid ? 1 : 0 }),
    })
    setUpdatingId(null)
    setUpdateAmount('')
    fetchData()
  }

  function getDueDateStatus(due: string, isPaid: number) {
    if (isPaid) return { label: 'Ödendi', cls: 'bg-green-100 text-green-600' }
    const todayStr = new Date().toISOString().split('T')[0]

    if (due < todayStr) return { label: 'Gecikti', cls: 'bg-red-100 text-red-600' }
    if (due === todayStr) return { label: 'Bugün', cls: 'bg-amber-100 text-amber-600' }

    const diff = Math.ceil((new Date(due).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24))
    return { label: `${diff} gün`, cls: 'bg-gray-100 text-gray-500' }
  }

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 transition-colors bg-white w-full font-medium text-gray-800'
  const gridLayoutCls = "grid grid-cols-[auto_2fr_1fr_1fr_1fr] items-center gap-4"

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen bg-gray-50/50">

      {/* Silme Onayı Modalı */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl"><Trash2 size={22} className="text-red-500" /></div>
              <div>
                <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Silme Onayı</p>
                <p className="text-sm font-bold text-gray-900">Bu ödemeyi silmek istediğine emin misin?</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleDelete(deleteConfirmId)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors">Evet, Sil</button>
              <button onClick={() => setDeleteConfirmId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors">Vazgeç</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start flex-col ">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ödeme Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Finansal borç yükü ve planlı ödemelerin takibi</p>
      </div>

      {/* PROJE GENELİNE UYGUN 2 KOLONLU BÜYÜK GRID DÜZENİ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* SOL TARAF: FORM VE TABLO LİSTESİ (2 Kolon Genişliğinde) */}
        <div className="lg:col-span-2 flex flex-col gap-6">


          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-violet-600 rounded-full" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-gray-700">{editingId ? 'Ödemeyi Düzenle' : 'YENİ ÖDEME GİRİŞİ'}</h2>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ödeme Adı <span className="text-red-500">*</span></label>
                <input type="text" value={form.payment_name} onChange={e => setForm({ ...form, payment_name: e.target.value })} placeholder="Kira, elektrik..." className={inputCls} />
              </div>

              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kategori</label>
                <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Fatura, mutfak..." className={inputCls} />
              </div>

              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tutar (₺) <span className="text-red-500">*</span></label>
                <input type="text" inputMode="numeric" value={amountDisplay} onChange={e => setAmountDisplay(formatAmountInput(e.target.value))} placeholder="10.000" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tarih <span className="text-red-500">*</span></label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Durum:</span>
                <div className="flex bg-gray-100 p-0.5 rounded-lg w-fit">
                  {[{ val: 0, label: 'Bekliyor' }, { val: 1, label: 'Ödendi' }].map(opt => (
                    <button key={opt.val} type="button" onClick={() => setForm({ ...form, is_paid: opt.val })}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${form.is_paid === opt.val ? opt.val === 1 ? 'bg-green-600 text-white shadow-xs' : 'bg-amber-500 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1 bg-red-50/60 px-3 py-1.5 rounded-lg flex-1 sm:max-w-xs justify-center sm:justify-start">
                  <AlertCircle size={14} /> {formError}
                </p>
              )}

              <div className="flex gap-2 justify-end shrink-0">
                <button onClick={closeForm} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100">Vazgeç</button>
                <button onClick={handleSave} className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer shadow-xs">{editingId ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </div>
          </div>


          {/* Filtre ve Arama Alanı */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-2 rounded-2xl shadow-xs border border-gray-100/50">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ödeme adı ile ara..."
                className="w-full font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-violet-400 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              {([
                { id: 'all', label: 'Tümü' },
                { id: 'pending', label: 'Bekleyen' },
                { id: 'overdue', label: 'Geciken' },
                { id: 'paid', label: 'Ödenen' }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tablo Listesi */}
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100">
            <div className={`${gridLayoutCls} px-5 py-3.5 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50/50`}>
              <div className="w-8"></div>
              <span>Ödeme Detayı</span>
              <span>Kalan Tutar</span>
              <span>Son Ödeme Tarihi</span>
              <span className="text-right">İşlemler</span>
            </div>

            {filteredAndSortedList.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">Aradığın kritere uygun ödeme kaydı bulunamadı.</p>
              </div>
            ) : filteredAndSortedList.map(p => {
              const status = getDueDateStatus(p.due_date, p.is_paid)
              const isUpdating = updatingId === p.id

              return (
                <div key={p.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${p.is_paid ? 'bg-gray-50/30' : ''}`}>
                  <div className={`${gridLayoutCls} px-5 py-4`}>

                    <div className="w-8 flex justify-start">
                      <button
                        onClick={() => togglePaid(p)}
                        title={p.is_paid ? 'Bekliyor olarak işaretle' : 'Tamamını ödendi olarak işaretle'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${p.is_paid ? 'text-green-500 bg-green-50 hover:bg-green-100' : 'text-gray-300 hover:text-green-600 hover:bg-green-50'}`}
                      >
                        <CircleCheck size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className={`text-sm font-semibold truncate ${p.is_paid ? 'line-through text-gray-400 font-normal' : 'text-gray-900'}`}>
                        {p.payment_name}
                      </span>
                      {p.category && (
                        <span className="text-[11px] font-semibold text-gray-400 truncate bg-gray-100 px-2 py-0.5 rounded-md w-fit mt-0.5">
                          {p.category}
                        </span>
                      )}
                    </div>

                    <span className={`text-sm font-bold ${p.is_paid ? 'text-gray-400 font-semibold' : 'text-gray-900'}`}>
                      {p.is_paid ? '—' : `₺${fmt(p.amount)}`}
                    </span>

                    <div className="flex flex-col gap-1 items-start">
                      <span className={`text-xs font-medium ${p.is_paid ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(p.due_date).toLocaleDateString('tr-TR')}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wide uppercase ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 justify-end">
                      {!p.is_paid && (
                        <button
                          onClick={() => { setUpdatingId(isUpdating ? null : p.id); setUpdateAmount('') }}
                          title="Kısmi ödeme düş"
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${isUpdating ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'}`}
                        >
                          <MoveDown size={15} />
                        </button>
                      )}

                      <button onClick={() => handleEdit(p)} title="Düzenle" className="p-2 text-gray-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 cursor-pointer transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirmId(p.id)} title="Sil" className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {isUpdating && (
                    <div className="px-5 pb-4 pt-1 bg-violet-50/30 border-t border-violet-50/50 flex justify-end animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="bg-white border border-violet-100 rounded-xl p-3 flex items-center gap-3 shadow-xs w-full max-w-md">
                        <span className="text-xs font-medium text-gray-500 shrink-0">
                          Kalan: <strong className="text-gray-900">₺{fmt(Math.max(p.amount - (parseAmountInput(updateAmount) || 0), 0))}</strong>
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={updateAmount}
                          onChange={e => setUpdateAmount(formatAmountInput(e.target.value))}
                          placeholder="Ödenen miktarı gir"
                          autoFocus
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-violet-400 bg-white"
                        />
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handlePartialPayment(p)} className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors font-semibold cursor-pointer">
                            Düş
                          </button>
                          <button onClick={() => { setUpdatingId(null); setUpdateAmount('') }} className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors font-medium cursor-pointer">
                            İptal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* SAĞ TARAF: DIKEY HIZALANMIŞ FİNANSAL ÖZET KARTLARI (1 Kolon Genişliğinde) */}
        <div className="flex flex-col gap-4">

          {/* Kasa Bakiyesi (Özel Vurgulu Kart) */}
          <div className="bg-violet-600 rounded-2xl p-4 flex items-center justify-between shadow-xs border border-violet-700">
            <div className="flex flex-col">
              <span className="text-violet-200 text-[11px] font-bold uppercase tracking-wider">TOPLAM KASA BAKİYESİ</span>
              <span className="text-white text-xl font-bold mt-1">₺{fmt(stats.netBalance)}</span>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl text-white">
              <Wallet size={20} />
            </div>
          </div>

          {/* Toplam Borç Kartı */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">TOPLAM BORÇ YÜKÜ</span>
              <span className="text-gray-900 text-xl font-bold mt-1">₺{fmt(stats.totalAll)}</span>
            </div>
            <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl border border-gray-100">
              <CreditCard size={20} />
            </div>
          </div>

          {/* Ödenen Borç Kartı */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">TOPLAM ÖDENEN</span>
              <span className="text-green-600 text-xl font-bold mt-1">₺{fmt(stats.totalPaid)}</span>
            </div>
            <div className="p-2.5 bg-green-50 text-green-500 rounded-xl border border-green-100">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Bekleyen Borç Kartı */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">BEKLEYEN ÖDEMELER</span>
              <span className="text-amber-500 text-xl font-bold mt-1">₺{fmt(stats.totalPending)}</span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl border border-amber-100">
              <TrendingDown size={20} />
            </div>
          </div>

          {/* Geciken Borç Kartı */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">GECİKEN BORÇLAR</span>
              <span className="text-red-500 text-xl font-bold mt-1">₺{fmt(stats.totalOverdue)}</span>
            </div>
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl border border-red-100">
              <AlertCircle size={20} />
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}