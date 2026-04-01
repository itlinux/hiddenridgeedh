import Link from 'next/link';
import { ArrowLeft, MessageSquare, Bell, ShieldAlert, XCircle, Users, Info, PartyPopper, Briefcase, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

export default function ForumAboutPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader label="Community Guide" title="How to Use this Site" />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-600 text-sm font-sans mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Forum
        </Link>

        <div className="space-y-8">

          {/* Intro card */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-4">
              <Info className="text-gold-400 flex-shrink-0" size={24} />
              <h2 className="font-serif text-2xl text-forest-800">What is this site for?</h2>
            </div>
            <p className="font-body text-forest-600 leading-relaxed">
              This is a private space for Hidden Ridge neighbors to connect, share information,
              and look out for one another — nothing more, nothing less. It is run by residents,
              for residents.
            </p>
          </div>

          {/* What it IS */}
          <div>
            <h2 className="font-serif text-xl text-forest-800 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-gold-400" />
              What this site <span className="text-gold-500 italic ml-1">is</span>
            </h2>
            <div className="space-y-4">

              <div className="bg-cream-100 rounded-sm p-5 border border-cream-200">
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-forest-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-semibold text-forest-700 mb-1">Getting to know your neighbors</p>
                    <p className="font-body text-sm text-forest-600 leading-relaxed">
                      Introduce yourself, welcome new residents, share a neighborhood memory,
                      or just say hello.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cream-100 rounded-sm p-5 border border-cream-200">
                <div className="flex items-start gap-3">
                  <Bell size={18} className="text-forest-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-semibold text-forest-700 mb-1">General neighborhood notifications</p>
                    <p className="font-body text-sm text-forest-600 leading-relaxed">
                      Heads-up posts useful to everyone — the gate is not working,
                      road work on Silva Valley Parkway, a lost pet, a package left at the wrong door.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cream-100 rounded-sm p-5 border border-cream-200">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={18} className="text-forest-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-semibold text-forest-700 mb-1">Safety, security &amp; suspicious activity</p>
                    <p className="font-body text-sm text-forest-600 leading-relaxed">
                      Rattlesnake on the trail, a garage door left open overnight, an unfamiliar
                      person or vehicle that doesn&apos;t feel right — post it so neighbors stay aware.
                      When in doubt, also call non-emergency dispatch.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cream-100 rounded-sm p-5 border border-cream-200">
                <div className="flex items-start gap-3">
                  <PartyPopper size={18} className="text-forest-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-semibold text-forest-700 mb-1">Events, garage sales &amp; neighborhood fun</p>
                    <p className="font-body text-sm text-forest-600 leading-relaxed">
                      Block BBQ, garage sale, holiday get-together, kids&apos; lemonade stand — spread
                      the word and get neighbors involved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cream-100 rounded-sm p-5 border border-cream-200">
                <div className="flex items-start gap-3">
                  <Briefcase size={18} className="text-forest-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-semibold text-forest-700 mb-1">Promoting your business</p>
                    <p className="font-body text-sm text-forest-600 leading-relaxed">
                      Neighbors supporting neighbors — feel free to share what you do and
                      promote your business here.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* HOA contact callout */}
          <div className="bg-cream-100 border border-cream-200 rounded-sm p-6">
            <p className="font-sans text-xs uppercase tracking-wider text-forest-400 mb-2">Need the HOA?</p>
            <p className="font-body text-sm text-forest-600 leading-relaxed">
              Hidden Ridge is managed by <strong>FirstService Residential</strong>. For complaints,
              rule violations, maintenance requests, or any official HOA matter, please reach out
              to them directly through the HOA portal or your account manager.
            </p>
          </div>

          {/* What it is NOT */}
          <div>
            <h2 className="font-serif text-xl text-forest-800 mb-4 flex items-center gap-2">
              <XCircle size={18} className="text-red-400" />
              What this site is <span className="text-red-400 italic ml-1">not</span>
            </h2>
            <div className="bg-red-50 border border-red-100 rounded-sm p-6 space-y-4">
              <div className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-forest-700 leading-relaxed">
                  <strong>Not an HOA complaint board.</strong> For formal complaints,
                  maintenance requests, rule violations, or anything requiring official
                  HOA action, please contact the HOA directly. Posts of that nature
                  may be removed to keep the forum focused.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-forest-700 leading-relaxed">
                  <strong>Not a place for politics, personal disputes, or negativity.</strong> Keep
                  it neighborly. Treat everyone here as you would face-to-face.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link href="/forum" className="btn-gold inline-flex items-center gap-2 text-sm px-6 py-3">
              <MessageSquare size={15} />
              Go to the Forum
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
