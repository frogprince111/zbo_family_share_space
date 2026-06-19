import { ChevronDown, Minus, Plus, RotateCcw, WalletCards, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageContainer } from '../components/PageContainer'
import { useLocalStorage } from '../hooks/useLocalStorage'

type BillType = 'expense' | 'income'

type Bill = {
  id: string
  type: BillType
  amount: number
  title: string
  createdAt: string
}

const defaultBills: Bill[] = [
  { id: 'market', type: 'expense', amount: 238, title: '超市采购', createdAt: '2026-06-18T09:00:00.000Z' },
  { id: 'utilities', type: 'expense', amount: 416, title: '水电燃气', createdAt: '2026-06-17T09:00:00.000Z' },
]

const billTypeText: Record<BillType, string> = {
  expense: '支出',
  income: '收入',
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey: string) {
  return `${monthKey.slice(0, 4)}年${Number(monthKey.slice(5, 7))}月`
}

function getShortMonthLabel(monthKey: string) {
  return `${Number(monthKey.slice(5, 7))}月`
}

export default function FinancePage() {
  const [bills, setBills] = useLocalStorage<Bill[]>('family-finance-bills', defaultBills)
  const [modalType, setModalType] = useState<BillType | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [annualDetailOpen, setAnnualDetailOpen] = useState(false)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [resetMonth, setResetMonth] = useState(getMonthKey(new Date()))
  const [selectedChartMonth, setSelectedChartMonth] = useState(getMonthKey(new Date()))
  const [resetIncome, setResetIncome] = useState('')
  const [resetExpense, setResetExpense] = useState('')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')

  const openBillModal = (type: BillType) => {
    setModalType(type)
    setAmount('')
    setTitle('')
  }

  const closeBillModal = () => {
    setModalType(null)
    setAmount('')
    setTitle('')
  }

  const handleSaveBill = () => {
    if (!modalType) return
    const numericAmount = Number(amount)
    const trimmedTitle = title.trim()
    if (!trimmedTitle || !Number.isFinite(numericAmount) || numericAmount <= 0) return

    setBills((current) => [
      {
        id: crypto.randomUUID(),
        type: modalType,
        amount: numericAmount,
        title: trimmedTitle,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    closeBillModal()
  }

  const openResetModal = () => {
    setResetMonth(groupedBillMonths[0] ?? currentMonthKey)
    setResetOpen(true)
  }

  const handleResetMonth = () => {
    const nextIncome = Number(resetIncome || 0)
    const nextExpense = Number(resetExpense || 0)
    if (!Number.isFinite(nextIncome) || !Number.isFinite(nextExpense) || nextIncome < 0 || nextExpense < 0) return

    const resetCreatedAt = `${resetMonth}-01T12:00:00.000Z`
    const replacementBills: Bill[] = []
    if (nextIncome > 0) {
      replacementBills.push({
        id: crypto.randomUUID(),
        type: 'income',
        amount: nextIncome,
        title: '重置收入',
        createdAt: resetCreatedAt,
      })
    }
    if (nextExpense > 0) {
      replacementBills.push({
        id: crypto.randomUUID(),
        type: 'expense',
        amount: nextExpense,
        title: '重置支出',
        createdAt: resetCreatedAt,
      })
    }

    setBills((current) => [
      ...replacementBills,
      ...current.filter((bill) => getMonthKey(new Date(bill.createdAt)) !== resetMonth),
    ])
    setResetOpen(false)
    if (expandedMonth === resetMonth) setExpandedMonth(null)
  }

  const currentMonthKey = getMonthKey(new Date())
  const monthlySummary = useMemo(() => {
    const summary = bills.reduce(
      (result, bill) => {
        const monthKey = getMonthKey(new Date(bill.createdAt))
        if (!result[monthKey]) result[monthKey] = { income: 0, expense: 0 }
        result[monthKey][bill.type] += bill.amount
        return result
      },
      {} as Record<string, Record<BillType, number>>,
    )

    return summary
  }, [bills])

  const currentMonthIncome = monthlySummary[currentMonthKey]?.income ?? 0
  const currentMonthExpense = monthlySummary[currentMonthKey]?.expense ?? 0
  const currentMonthBalance = currentMonthIncome - currentMonthExpense
  const currentYear = new Date().getFullYear()
  const yearlyBalanceRows = useMemo(() => {
    return Object.entries(monthlySummary)
      .filter(([monthKey]) => Number(monthKey.slice(0, 4)) === currentYear)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, summary]) => ({
        monthKey,
        income: summary.income,
        expense: summary.expense,
        balance: summary.income - summary.expense,
      }))
  }, [currentYear, monthlySummary])
  const annualBalance = yearlyBalanceRows
    .filter((item) => item.monthKey < currentMonthKey)
    .reduce((sum, item) => sum + item.balance, 0)

  const chartData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: now.getMonth() + 1 }, (_, index) => {
      const date = new Date(now.getFullYear(), index, 1)
      const monthKey = getMonthKey(date)
      return {
        monthKey,
        label: getShortMonthLabel(monthKey),
        income: monthlySummary[monthKey]?.income ?? 0,
        expense: monthlySummary[monthKey]?.expense ?? 0,
      }
    })
  }, [monthlySummary])

  const chartMaxAmount = Math.max(...chartData.flatMap((item) => [item.income, item.expense]), 1)
  const selectedChartItem = chartData.find((item) => item.monthKey === selectedChartMonth) ?? chartData[chartData.length - 1]
  const recentBills = bills.slice(0, 3)
  const groupedBills = useMemo(() => {
    return bills.reduce(
      (groups, bill) => {
        const monthKey = getMonthKey(new Date(bill.createdAt))
        if (!groups[monthKey]) groups[monthKey] = []
        groups[monthKey].push(bill)
        return groups
      },
      {} as Record<string, Bill[]>,
    )
  }, [bills])
  const groupedBillMonths = Object.keys(groupedBills).sort((a, b) => b.localeCompare(a))
  const currentMonthNumber = new Date().getMonth() + 1
  const resetMonthOptions = Array.from(
    { length: currentMonthNumber },
    (_, index) => `${currentYear}-${String(index + 1).padStart(2, '0')}`,
  )
  const resetMonthBills = groupedBills[resetMonth] ?? []
  const resetMonthIncome = resetMonthBills.filter((bill) => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0)
  const resetMonthExpense = resetMonthBills.filter((bill) => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0)

  useEffect(() => {
    if (!resetOpen) return
    setResetIncome(resetMonthIncome > 0 ? String(resetMonthIncome) : '')
    setResetExpense(resetMonthExpense > 0 ? String(resetMonthExpense) : '')
  }, [resetOpen, resetMonth, resetMonthIncome, resetMonthExpense])

  return (
    <PageContainer>
      <section className="rounded-[24px] border border-family-border bg-white p-6 shadow-soft sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-family-text">家庭理财</h1>
          <button
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-family-primary px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
            onClick={openResetModal}
          >
            <RotateCcw size={18} />
            重置收支
          </button>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {[
            ['本月收入', formatCurrency(currentMonthIncome), 'text-emerald-600'],
            ['本月支出', formatCurrency(currentMonthExpense), 'text-rose-600'],
            ['本月结余', formatCurrency(currentMonthBalance), currentMonthBalance >= 0 ? 'text-family-text' : 'text-rose-600'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-[20px] bg-slate-50 p-5">
              <p className="text-sm text-family-muted">{label}</p>
              <p className={`mt-3 text-2xl font-black ${color}`}>{value}</p>
            </div>
          ))}
          <button
            type="button"
            className="rounded-[20px] bg-slate-50 p-5 text-left transition hover:bg-family-primarySoft active:scale-[0.99]"
            onClick={() => setAnnualDetailOpen(true)}
          >
            <p className="text-sm text-family-muted">年度结余</p>
            <p className={`mt-3 text-2xl font-black ${annualBalance >= 0 ? 'text-family-text' : 'text-rose-600'}`}>
              {formatCurrency(annualBalance)}
            </p>
            <p className="mt-2 text-xs font-semibold text-family-muted">点击查看每月结余</p>
          </button>
        </div>
      </section>
      <section className="mt-6 rounded-[24px] border border-family-border bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-xl font-bold text-family-text">
          <WalletCards size={22} />
          最近账单
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-rose-500 text-base font-black text-white shadow-sm hover:bg-rose-600 active:scale-95"
            onClick={() => openBillModal('expense')}
          >
            <Minus size={20} />
            支出
          </button>
          <button
            type="button"
            className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-500 text-base font-black text-white shadow-sm hover:bg-emerald-600 active:scale-95"
            onClick={() => openBillModal('income')}
          >
            <Plus size={20} />
            收入
          </button>
        </div>
        <div className="mt-5 grid gap-3 text-sm">
          {recentBills.map((bill) => (
            <p
              key={bill.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 font-semibold ${
                bill.type === 'expense' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <span>{bill.title}</span>
              <span>
                {bill.type === 'expense' ? '-' : '+'} {formatCurrency(bill.amount)}
              </span>
            </p>
          ))}
          <button
            type="button"
            className="mt-1 h-12 cursor-pointer rounded-full bg-family-primary text-sm font-black text-white shadow-sm hover:bg-violet-600 active:scale-95"
            onClick={() => {
              setDetailOpen(true)
              setExpandedMonth(groupedBillMonths[0] ?? null)
            }}
          >
            查看收支详情
          </button>
        </div>

        <section className="mt-7 rounded-[20px] bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-black text-family-text">月度收支柱状图</h3>
            <div className="flex items-center gap-4 text-xs font-bold text-family-muted">
              <span className="flex items-center gap-1">
                <i className="h-3 w-3 rounded-full bg-emerald-500" />
                收入
              </span>
              <span className="flex items-center gap-1">
                <i className="h-3 w-3 rounded-full bg-rose-500" />
                支出
              </span>
            </div>
          </div>

          {selectedChartItem && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-3">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-bold text-family-muted">{getMonthLabel(selectedChartItem.monthKey)}收入</p>
                <p className="mt-1 text-lg font-black text-emerald-600">{formatCurrency(selectedChartItem.income)}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 px-4 py-3">
                <p className="text-xs font-bold text-family-muted">{getMonthLabel(selectedChartItem.monthKey)}支出</p>
                <p className="mt-1 text-lg font-black text-rose-600">{formatCurrency(selectedChartItem.expense)}</p>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
            <div className="flex h-48 flex-col justify-between text-right text-xs font-semibold text-family-muted">
              <span>{formatCurrency(chartMaxAmount)}</span>
              <span>{formatCurrency(chartMaxAmount / 2)}</span>
              <span>¥0</span>
            </div>
            <div className="relative h-48 border-b border-l border-family-border">
              <div className="absolute inset-0 flex flex-col justify-between">
                <span className="border-t border-white" />
                <span className="border-t border-white" />
                <span className="border-t border-white" />
              </div>
              <div className="relative z-10 grid h-full items-end gap-2 px-2" style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}>
                {chartData.map((item) => (
                  <button
                    key={item.monthKey}
                    type="button"
                    aria-label={`查看${item.label}收支金额`}
                    className={`flex h-full cursor-pointer items-end justify-center gap-1 rounded-t-2xl px-1 transition hover:bg-white/70 active:scale-95 ${
                      selectedChartItem?.monthKey === item.monthKey ? 'bg-white ring-2 ring-family-primary/30' : ''
                    }`}
                    onClick={() => setSelectedChartMonth(item.monthKey)}
                  >
                    <div
                      className="w-4 rounded-t-full bg-emerald-500 transition-all sm:w-5"
                      title={`${item.label}收入：${formatCurrency(item.income)}`}
                      style={{ height: `${Math.max((item.income / chartMaxAmount) * 100, item.income > 0 ? 6 : 0)}%` }}
                    />
                    <div
                      className="w-4 rounded-t-full bg-rose-500 transition-all sm:w-5"
                      title={`${item.label}支出：${formatCurrency(item.expense)}`}
                      style={{ height: `${Math.max((item.expense / chartMaxAmount) * 100, item.expense > 0 ? 6 : 0)}%` }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div />
            <div className="grid gap-2 px-2 text-center text-xs font-bold text-family-muted" style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}>
              {chartData.map((item) => (
                <button
                  key={item.monthKey}
                  type="button"
                  className={`cursor-pointer rounded-full px-2 py-1 font-bold ${
                    selectedChartItem?.monthKey === item.monthKey ? 'bg-family-primary text-white' : 'text-family-muted hover:bg-white'
                  }`}
                  onClick={() => setSelectedChartMonth(item.monthKey)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>

      {detailOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 px-4 py-8" onMouseDown={() => setDetailOpen(false)}>
          <section
            className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-family-primary">全部账单</p>
                <h2 id="bill-detail-title" className="mt-2 text-2xl font-black text-family-text">
                  收支详情
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭收支详情"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setDetailOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {groupedBillMonths.map((monthKey) => {
                const monthBills = groupedBills[monthKey]
                const monthIncome = monthBills.filter((bill) => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0)
                const monthExpense = monthBills.filter((bill) => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0)
                const isExpanded = expandedMonth === monthKey

                return (
                  <section key={monthKey} className="rounded-[20px] border border-family-border bg-slate-50">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left active:scale-[0.99]"
                      onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                    >
                      <div>
                        <p className="text-base font-black text-family-text">{getMonthLabel(monthKey)}</p>
                        <p className="mt-1 text-xs font-semibold text-family-muted">
                          收入 {formatCurrency(monthIncome)} · 支出 {formatCurrency(monthExpense)}
                        </p>
                      </div>
                      <ChevronDown className={`text-family-muted transition ${isExpanded ? 'rotate-180' : ''}`} size={22} />
                    </button>

                    {isExpanded && (
                      <div className="grid gap-2 border-t border-family-border px-4 py-4">
                        {monthBills.map((bill) => (
                          <div
                            key={bill.id}
                            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold ${
                              bill.type === 'expense' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <span>{bill.title}</span>
                            <span>
                              {bill.type === 'expense' ? '-' : '+'} {formatCurrency(bill.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {annualDetailOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 px-4 py-8" onMouseDown={() => setAnnualDetailOpen(false)}>
          <section
            className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="annual-balance-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-family-primary">{currentYear} 年</p>
                <h2 id="annual-balance-title" className="mt-2 text-2xl font-black text-family-text">
                  年度结余明细
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭年度结余明细"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setAnnualDetailOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold leading-6 text-family-muted">
                年度结余为当前月份之前的每月结余累加：{formatCurrency(annualBalance)}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {yearlyBalanceRows.length > 0 ? (
                yearlyBalanceRows.map((item) => (
                  <div key={item.monthKey} className="rounded-[20px] border border-family-border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-black text-family-text">{getMonthLabel(item.monthKey)}</p>
                      <p className={`text-lg font-black ${item.balance >= 0 ? 'text-family-text' : 'text-rose-600'}`}>
                        {formatCurrency(item.balance)}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold">
                      <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-600">
                        收入 {formatCurrency(item.income)}
                      </span>
                      <span className="rounded-2xl bg-rose-50 px-3 py-2 text-rose-600">
                        支出 {formatCurrency(item.expense)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-family-muted">
                  今年还没有收支记录
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {resetOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 px-4 py-8" onMouseDown={() => setResetOpen(false)}>
          <section
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-bill-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-family-primary">月份清零</p>
                <h2 id="reset-bill-title" className="mt-2 text-2xl font-black text-family-text">
                  重置收支
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭重置收支"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setResetOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label className="mt-6 grid gap-2 text-sm font-semibold text-family-text">
              选择要重置的月份
              <select
                value={resetMonth}
                className="rounded-2xl border border-family-border bg-white px-4 py-3 text-family-text outline-none focus:border-family-primary"
                onChange={(event) => setResetMonth(event.target.value)}
              >
                {resetMonthOptions.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {getMonthLabel(monthKey)}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="grid gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-600">
                该月收入
                <input
                  value={resetIncome}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-3 text-xl font-black text-emerald-600 outline-none focus:border-emerald-400"
                  onChange={(event) => setResetIncome(event.target.value)}
                />
              </label>
              <label className="grid gap-2 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-600">
                该月支出
                <input
                  value={resetExpense}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full rounded-xl border border-rose-100 bg-white px-3 py-3 text-xl font-black text-rose-600 outline-none focus:border-rose-400"
                  onChange={(event) => setResetExpense(event.target.value)}
                />
              </label>
            </div>

            <p className="mt-4 text-sm font-semibold leading-6 text-family-muted">
              重置后会先清空该月份原有账单，再按填写金额生成新的该月收入和支出；不填写或填 0 就表示该项清零。
            </p>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                className="h-12 flex-1 cursor-pointer rounded-full border border-family-border bg-white text-sm font-bold text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={() => setResetOpen(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="h-12 flex-1 cursor-pointer rounded-full bg-rose-500 text-sm font-black text-white hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                onClick={handleResetMonth}
              >
                保存重置
              </button>
            </div>
          </section>
        </div>
      )}

      {modalType && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 px-4 py-8" onMouseDown={closeBillModal}>
          <section
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-bold ${modalType === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {billTypeText[modalType]}
                </p>
                <h2 id="bill-modal-title" className="mt-2 text-2xl font-black text-family-text">
                  记录{billTypeText[modalType]}事项
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭弹窗"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={closeBillModal}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                金额
                <input
                  value={amount}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="请输入金额"
                  className="rounded-2xl border border-family-border px-4 py-4 text-2xl font-black text-family-text outline-none focus:border-family-primary"
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-family-text">
                {modalType === 'expense' ? '消费事项' : '收入事项'}
                <input
                  value={title}
                  maxLength={24}
                  placeholder={modalType === 'expense' ? '例如：买菜、房租、水电费' : '例如：工资、奖金、红包'}
                  className="rounded-2xl border border-family-border px-4 py-3 text-family-text outline-none placeholder:text-slate-400 focus:border-family-primary"
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
            </div>

            <button
              type="button"
              className={`mt-7 h-14 w-full cursor-pointer rounded-full text-lg font-black text-white shadow-sm active:scale-95 ${
                modalType === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
              onClick={handleSaveBill}
            >
              保存{billTypeText[modalType]}
            </button>
          </section>
        </div>
      )}
    </PageContainer>
  )
}
