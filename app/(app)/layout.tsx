import { Header } from '@/components/layout/header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header showMenuButton={false} />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto px-4 py-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}