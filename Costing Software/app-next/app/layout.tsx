import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['300','400','500','600','700','800'] })
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','500'] })

export const metadata: Metadata = {
  title: 'Array Metal Costing',
  description: 'Internal costing and SKU management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-sans antialiased overflow-hidden">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
