import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PageContainer } from '../components/PageContainer'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { addNotification } from '../services/notifications'

type TodoItem = {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

const initialTodos: TodoItem[] = [
  { id: 'living-room', title: '整理客厅', completed: false, createdAt: '2026-06-18T09:00:00.000Z' },
  { id: 'flowers', title: '浇花', completed: false, createdAt: '2026-06-18T09:10:00.000Z' },
  { id: 'weekend-plan', title: '确认周末安排', completed: false, createdAt: '2026-06-18T09:20:00.000Z' },
]

export default function TodoPage() {
  const [todos, setTodos] = useLocalStorage<TodoItem[]>('family-todos', initialTodos)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const [contextTodo, setContextTodo] = useState<TodoItem | null>(null)
  const [contextPosition, setContextPosition] = useState({ x: 0, y: 0 })
  const [text, setText] = useState('')
  const longPressTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const closeMenu = () => setContextTodo(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const closeModal = () => {
    setModalOpen(false)
    setEditingTodo(null)
    setText('')
  }

  const openAddModal = () => {
    setEditingTodo(null)
    setText('')
    setModalOpen(true)
  }

  const openRenameModal = (todo: TodoItem) => {
    setEditingTodo(todo)
    setText(todo.title)
    setContextTodo(null)
    setModalOpen(true)
  }

  const handleSaveTodo = () => {
    const title = text.trim()
    if (!title) return

    if (editingTodo) {
      setTodos((current) => current.map((todo) => (todo.id === editingTodo.id ? { ...todo, title } : todo)))
      addNotification('待办', `待办已重命名：${title}`)
      closeModal()
      return
    }

    setTodos((current) => [
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    addNotification('待办', `新增待办：${title}`)
    closeModal()
  }

  const toggleTodo = (id: string) => {
    const target = todos.find((todo) => todo.id === id)
    if (!target) return
    const completed = !target.completed
    setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, completed } : todo)))
    addNotification('待办', `${target.title} 已标记为${completed ? '完成' : '未完成'}`)
  }

  const openContextMenu = (todo: TodoItem, x: number, y: number) => {
    setContextTodo(todo)
    setContextPosition({ x, y })
  }

  const deleteTodo = (todo: TodoItem) => {
    setTodos((current) => current.filter((item) => item.id !== todo.id))
    setContextTodo(null)
    addNotification('待办', `已删除待办：${todo.title}`)
  }

  const startLongPress = (todo: TodoItem, x: number, y: number) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = window.setTimeout(() => openContextMenu(todo, x, y), 550)
  }

  const cancelLongPress = () => {
    if (!longPressTimerRef.current) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  return (
    <PageContainer>
      <section className="rounded-[24px] border border-family-border bg-white p-6 shadow-soft sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-family-text">家庭待办</h1>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-family-primary px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 active:scale-95"
            onClick={openAddModal}
          >
            <Plus size={18} />
            新增
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <label
                key={todo.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 font-semibold transition ${
                  todo.completed
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-family-border bg-white text-family-text hover:bg-slate-50'
                }`}
                onContextMenu={(event) => {
                  event.preventDefault()
                  openContextMenu(todo, event.clientX, event.clientY)
                }}
                onTouchStart={(event) => {
                  const touch = event.touches[0]
                  startLongPress(todo, touch.clientX, touch.clientY)
                }}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  className="h-5 w-5 accent-emerald-500"
                  onChange={() => toggleTodo(todo.id)}
                />
                <span className={todo.completed ? 'line-through decoration-2' : ''}>{todo.title}</span>
              </label>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-family-muted">
              还没有待办，点右上角新增一个吧。
            </p>
          )}
        </div>
      </section>

      {contextTodo && (
        <div
          className="fixed z-50 w-40 overflow-hidden rounded-2xl border border-family-border bg-white py-2 shadow-soft"
          style={{ left: contextPosition.x, top: contextPosition.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-family-text hover:bg-family-primarySoft"
            onClick={() => openRenameModal(contextTodo)}
          >
            <Pencil size={16} />
            重命名
          </button>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-rose-500 hover:bg-rose-50"
            onClick={() => deleteTodo(contextTodo)}
          >
            <Trash2 size={16} />
            删除
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/25 px-4 py-8" onMouseDown={closeModal}>
          <section
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="todo-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-family-primary">待办事项</p>
                <h2 id="todo-modal-title" className="mt-2 text-2xl font-black text-family-text">
                  {editingTodo ? '重命名待办' : '新增待办'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="关闭新增待办"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-family-muted hover:bg-slate-50 active:scale-95"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <label className="mt-6 grid gap-2 text-sm font-semibold text-family-text">
              待办内容
              <textarea
                value={text}
                rows={4}
                maxLength={80}
                placeholder="例如：晚上一起收拾餐桌"
                className="resize-none rounded-2xl border border-family-border px-4 py-3 text-family-text outline-none placeholder:text-slate-400 focus:border-family-primary"
                onChange={(event) => setText(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="mt-7 h-14 w-full cursor-pointer rounded-full bg-family-primary text-lg font-black text-white shadow-sm hover:bg-violet-600 active:scale-95"
              onClick={handleSaveTodo}
            >
              {editingTodo ? '保存修改' : '保存待办'}
            </button>
          </section>
        </div>
      )}
    </PageContainer>
  )
}
