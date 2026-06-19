import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initNativeApp } from './utils/nativeApp'

function showRuntimeFallback() {
  const root = document.getElementById('root')
  if (!root || root.childElementCount > 0) return
  root.innerHTML = `
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8F9FC;padding:24px;text-align:center;color:#1f2430;font-family:system-ui,-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;">
      <section style="border-radius:24px;background:#fff;padding:28px;box-shadow:0 12px 36px rgba(42,47,66,.08);">
        <h1 style="margin:0;font-size:24px;font-weight:900;">页面加载失败</h1>
        <p style="margin:12px 0 0;color:#7b8190;font-size:14px;font-weight:700;">请关闭应用后重新打开，或重新安装最新版本。</p>
        <button style="margin-top:24px;border:0;border-radius:16px;background:#7467F0;color:#fff;padding:12px 20px;font-weight:800;" onclick="window.location.href='./#/home'">返回首页</button>
      </section>
    </main>
  `
}

window.addEventListener('error', showRuntimeFallback)
window.addEventListener('unhandledrejection', showRuntimeFallback)

function normalizeHashRoute() {
  const { hash, pathname, search } = window.location
  const routePaths = ['/home', '/schedule', '/todo', '/album', '/finance', '/members', '/settings', '/chat']
  if (hash.startsWith('#/') && pathname !== '/' && !pathname.endsWith('/index.html')) {
    window.history.replaceState(null, '', `/${search}${hash}`)
    return
  }

  if (!hash && routePaths.includes(pathname)) {
    window.history.replaceState(null, '', `/${search}#${pathname}`)
  }
}

normalizeHashRoute()
initNativeApp()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
