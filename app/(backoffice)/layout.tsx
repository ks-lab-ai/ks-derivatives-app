'use client'

import { useState } from 'react'
import { BackofficeSidebar } from '@/components/backoffice/sidebar'
import { BackofficeHeader } from '@/components/backoffice/header'
import { MobileBackofficeSidebar } from '@/components/backoffice/mobile-sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { cn } from '@/lib/utils'

function BackofficeLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - Fixed width, not collapsible */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <BackofficeSidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileBackofficeSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <BackofficeHeader showMenuButton onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto px-4 py-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return <BackofficeLayoutContent>{children}</BackofficeLayoutContent>
}