import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prop 22 Earnings Top‑Up Calculator',
  description: 'Estimate guaranteed earnings adjustment under California Prop 22.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-5xl p-6 md:p-10">{children}</div>
      </body>
    </html>
  )
}
