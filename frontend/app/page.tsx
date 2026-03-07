import Link from 'next/link';
import { ArrowRight, Trees, Users, Calendar, MessageSquare, Camera } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-cream-50">

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[80vh] flex items-center justify-center"
        style={{ backgroundImage: 'url(/images/hero-bg.webp)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
      >
        <div className="absolute inset-0 bg-forest-800/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <p className="section-label text-gold-400 mb-6">Welcome to</p>
          <h1 className="font-serif text-5xl sm:text-7xl text-cream-100 leading-tight mb-6">
            Hidden Ridge
            <span className="block text-gold-400 italic">El Dorado Hills</span>
          </h1>
          <div className="divider-gold" />
          <p className="font-body text-forest-300 text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
            Connecting neighbors, sharing news, and celebrating our neighborhood.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/register" className="btn-gold text-base px-8 py-4">
              Request Access
            </Link>
            <Link href="/blog" className="btn-secondary text-cream-200 border-cream-400 text-base px-8 py-4">
              Neighborhood News
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="section-label text-bark-400">Everything you need</p>
          <h2 className="font-serif text-4xl text-forest-800 mt-3">Your Neighborhood, Connected</h2>
          <div className="divider-gold" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Trees,
              title: 'Neighborhood Blog',
              desc: 'Stay informed with neighborhood news, HOA updates, and local announcements from your neighborhood administrators.',
              href: '/blog',
              color: 'text-forest-600',
            },
            {
              icon: Camera,
              title: 'Photo Gallery',
              desc: 'Share and browse photos of our beautiful neighborhood — homes, events, seasonal highlights, and more.',
              href: '/gallery',
              color: 'text-gold-500',
            },
            {
              icon: Calendar,
              title: 'Events Calendar',
              desc: 'Never miss a neighborhood event. RSVP to block parties, HOA meetings, holiday gatherings, and more.',
              href: '/events',
              color: 'text-forest-600',
            },
            {
              icon: MessageSquare,
              title: 'Neighbor Forum',
              desc: 'Discuss local topics, share recommendations, coordinate for lost pets, or find a trusted contractor.',
              href: '/forum',
              color: 'text-gold-500',
            },
            {
              icon: Users,
              title: 'Member Directory',
              desc: 'Get to know your neighbors. Browse profiles of approved Hidden Ridge residents.',
              href: '/members',
              color: 'text-forest-600',
            },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="card p-8 group hover:shadow-md transition-shadow duration-300"
            >
              <feature.icon className={`${feature.color} mb-4`} size={28} />
              <h3 className="font-serif text-xl text-forest-800 mb-3 group-hover:text-forest-600 transition-colors">
                {feature.title}
              </h3>
              <p className="font-body text-forest-500 text-sm leading-relaxed mb-4">{feature.desc}</p>
              <span className="flex items-center gap-1 text-gold-500 text-xs font-sans uppercase tracking-wider">
                Explore <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Membership CTA */}
      <section className="bg-forest-800 py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400">Residents Only</p>
          <h2 className="font-serif text-4xl text-cream-100 mt-3 mb-4">
            Ready to Join Your Neighbors?
          </h2>
          <div className="divider-gold" />
          <p className="font-body text-forest-300 text-lg mt-6 mb-10 leading-relaxed">
            Registration will be available soon for Hidden Ridge residents. All accounts will be reviewed and approved by neighborhood administrators to ensure a safe, trusted environment.
          </p>
          <Link href="/register" className="btn-gold text-base px-10 py-4">
            Learn More
          </Link>
          <p className="text-forest-400 text-sm mt-4 font-sans">
            Already a member? <Link href="/login" className="text-gold-400 hover:underline">Sign in here</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
