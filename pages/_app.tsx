import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '../components/ThemeProvider'
import ThemeToggle from '../components/ThemeToggle'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <main className={inter.className}>
        <ThemeToggle />
        <Component {...pageProps} />
      </main>
    </ThemeProvider>
  )
} 