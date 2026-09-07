import {
  ArrowUpRight,
  Camera,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
} from 'lucide-react'

const links = [
  {
    label: 'WhatsApp',
    description: 'Chat with our team',
    href: 'https://wa.me/2348000000000',
    icon: MessageCircle,
  },
  {
    label: 'Instagram',
    description: 'Follow our latest finds',
    href: 'https://instagram.com/sinomartng',
    icon: Camera,
  },
  {
    label: 'Email Us',
    description: 'Send us a message',
    href: 'mailto:hello@sinomart.ng',
    icon: Mail,
  },
]

export function SocialContactSection() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 lg:px-8 lg:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-brand-50">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-white/70 blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-brand-500" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600 sm:text-[11px]">
                Stay connected
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Talk to Sinomart
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-700 sm:text-base">
              Questions about an order, bulk pricing, delivery,
              or something you spotted in-store? Our team is
              here to help.
            </p>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            {links.map(
              ({
                label,
                description,
                href,
                icon: Icon,
              }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white p-3.5 shadow-[0_3px_14px_rgba(13,94,111,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_10px_24px_rgba(13,94,111,0.1)] sm:p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-200 group-hover:bg-brand-100">
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">
                      {label}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {description}
                    </p>
                  </div>

                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-500 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function StoreLocationSection() {
  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 lg:px-8 lg:py-12">
      <div className="mb-5 sm:mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-brand-500" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600 sm:text-[11px]">
            Come visit
          </span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Find us in Lagos
        </h2>

        <p className="mt-1 text-sm text-ink-500 sm:text-base">
          Explore Sinomart in person at The Palms Shopping Mall.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-3xl border border-ink-900/[0.07] bg-white shadow-[0_5px_22px_rgba(16,20,24,0.05)] lg:grid-cols-[0.9fr_1.1fr]">
        {/* Location details */}
        <div className="relative flex flex-col justify-center overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand-50 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <MapPin
                className="h-6 w-6"
                strokeWidth={1.8}
              />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              Sinomart Super Store
            </p>

            <h3 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              “China in Lagos”
            </h3>

            <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-ink-700">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                strokeWidth={2}
              />

              <span>
                The Palms Shopping Mall,
                <br />
                Lekki-Epe Expressway,
                <br />
                Victoria Island, Lagos
              </span>
            </p>

            <a
              href="https://maps.google.com/?q=The+Palms+Mall+Lekki+Lagos"
              target="_blank"
              rel="noreferrer"
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-md"
            >
              <Navigation
                className="h-4 w-4"
                strokeWidth={1.8}
              />

              Get Directions

              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* Map */}
        <div className="relative min-h-[300px] overflow-hidden border-t border-ink-900/[0.06] lg:min-h-[420px] lg:border-l lg:border-t-0">
          <iframe
            title="Sinomart Super Store location at The Palms Mall, Lagos"
            src="https://maps.google.com/maps?q=The%20Palms%20Shopping%20Mall%2C%20Lekki-Epe%20Expressway%2C%20Victoria%20Island%2C%20Lagos&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />

          {/* Map label */}
          <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <MapPin className="h-3.5 w-3.5" />
              </span>

              <div>
                <p className="text-[10px] font-semibold text-ink-900">
                  Sinomart
                </p>

                <p className="text-[9px] text-ink-500">
                  The Palms Mall
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}