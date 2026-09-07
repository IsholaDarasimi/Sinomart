import * as React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { subscribeNewsletter } from '@/services/misc'

export function Footer() {
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const { toast } = useToast()

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      await subscribeNewsletter(email)
      toast({ title: 'Subscribed!', description: "You'll hear about our weekend deals first.", variant: 'success' })
      setEmail('')
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <footer className="mt-16 border-t border-ink-900/8 bg-brand-900 text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-lg font-bold text-white">Sinomart Super Store</p>
            <p className="mt-2 text-sm">Lagos's home for everything — quality products at superstore prices.</p>
            <div className="mt-4 flex gap-3">
              <a href="https://wa.me/2348000000000" aria-label="WhatsApp" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <Phone className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/sinomartng" aria-label="Instagram" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <Camera className="h-4 w-4" />
              </a>
              <a href="mailto:hello@sinomart.ng" aria-label="Email" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-white">All Products</Link></li>
              <li><Link to="/shop?discounted=true" className="hover:text-white">Deals</Link></li>
              <li><Link to="/shop?sort=newest" className="hover:text-white">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Visit Our Store</p>
            <p className="mt-3 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              The Palms Shopping Mall, Lekki-Epe Expressway, Victoria Island, Lagos
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Stay in the loop</p>
            <form onSubmit={handleSubscribe} className="mt-3 flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
              <Button type="submit" variant="secondary" disabled={submitting}>
                Join
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
          © {new Date().getFullYear()} Sinomart Super Store. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
