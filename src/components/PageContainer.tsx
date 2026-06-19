import type { ReactNode } from 'react'

type PageContainerProps = {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`safe-page-bottom min-h-screen w-full max-w-none overflow-x-hidden px-4 pt-8 sm:mx-auto sm:max-w-[1200px] sm:px-8 sm:pt-9 lg:px-10 ${className}`}>
      {children}
    </main>
  )
}
