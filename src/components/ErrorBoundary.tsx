import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, info)
    }
  }

  clearAvatarCache = () => {
    try {
      window.localStorage.removeItem('family-online-visitor-avatar')
      window.localStorage.removeItem('family-online-local-visitors')

      const memberRaw = window.localStorage.getItem('family-members')
      if (memberRaw) {
        const members = JSON.parse(memberRaw) as Array<{ avatar?: string }>
        window.localStorage.setItem('family-members', JSON.stringify(members.map((member) => ({ ...member, avatar: '' }))))
      }
    } catch {
      window.localStorage.clear()
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#F8F9FC] px-6 text-center">
          <section className="rounded-[24px] bg-white p-7 shadow-soft">
            <h1 className="text-2xl font-black text-family-text">页面加载失败</h1>
            <p className="mt-3 text-sm font-semibold text-family-muted">请重新打开应用。</p>
            <button
              type="button"
              className="mt-6 rounded-2xl bg-family-primary px-5 py-3 text-sm font-bold text-white"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
            <button
              type="button"
              className="mt-3 block w-full rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-family-text"
              onClick={this.clearAvatarCache}
            >
              清理头像缓存并重载
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
