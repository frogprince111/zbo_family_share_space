import type { ReactNode } from 'react'

type PageContainerProps = {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`safe-page-bottom mx-auto min-h-screen w-full max-w-[1200px] px-5 pt-9 sm:px-8 lg:px-10 ${className}`}>
      {children}
    </main>
  )
}
