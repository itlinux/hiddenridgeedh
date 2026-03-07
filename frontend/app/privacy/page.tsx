'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <PageHeader label="Legal" title="Privacy Policy" subtitle="Effective Date: March 6, 2026" />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-600 text-sm font-sans mb-8 transition-colors">
          <ArrowLeft size={14} />
          Back to Home
        </Link>

        <div className="space-y-10">

          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-gold-400" size={24} />
              <h2 className="font-serif text-2xl text-forest-800">Your Privacy Matters</h2>
            </div>
            <p className="font-body text-forest-600 leading-relaxed">
              Hidden Ridge EDH (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website{' '}
              <strong>hiddenridgeedh.com</strong> as a private neighborhood community portal for residents of
              Hidden Ridge in El Dorado Hills, California. This Privacy Policy explains how we collect, use,
              protect, and share information gathered through our website.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              1. Information We Collect
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>We collect the following information when you register for an account or update your profile:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Information:</strong> Full name, email address, phone number, and street address.</li>
                <li><strong>Account Information:</strong> Username and password (stored in encrypted/hashed form).</li>
                <li><strong>Location Data:</strong> Latitude and longitude coordinates, if you choose to appear on the neighborhood map.</li>
                <li><strong>Profile Information:</strong> Any optional details you add to your member profile, such as a bio or profile photo.</li>
                <li><strong>Usage Data:</strong> We may collect basic server logs including IP addresses, browser type, and pages visited for security and troubleshooting purposes.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              2. How We Use Your Information
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>Your information is used exclusively for neighborhood community purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Member Directory:</strong> To display your name, address, and contact information to other approved members in the neighborhood directory.</li>
                <li><strong>Neighborhood Map:</strong> To show your location on the private neighborhood map (only if you opt in by providing coordinates).</li>
                <li><strong>Communications:</strong> To send neighborhood newsletters, event notifications, and account-related emails.</li>
                <li><strong>Account Management:</strong> To authenticate your identity, manage your account, and process registration approvals.</li>
                <li><strong>Community Features:</strong> To enable participation in the forum, event RSVPs, photo gallery, and blog comments.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              3. Member Data Privacy &amp; Non-Disclosure
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <div className="bg-cream-100 border border-cream-200 rounded-sm p-5">
                <p className="font-sans text-sm text-forest-700 font-semibold mb-2">
                  Important: All member information is strictly private.
                </p>
                <p>
                  By using this website, all members agree that personal information — including names, email
                  addresses, phone numbers, street addresses, map locations, and any other data shared through
                  the platform — is intended solely for private neighborhood use among approved Hidden Ridge
                  residents.
                </p>
              </div>
              <p><strong>Members may not:</strong></p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Share, distribute, or sell member information to any business, third party, or commercial entity.</li>
                <li>Use member contact information for solicitation, marketing, or commercial purposes.</li>
                <li>Compile or export member data for use outside of this community.</li>
                <li>Share screenshots, downloads, or copies of the member directory, map, or contact details with non-members.</li>
              </ul>
              <p>
                Violation of this policy may result in immediate account suspension or removal from the platform.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              4. Data Sharing &amp; Third Parties
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>We do not sell, rent, or trade your personal information. We may share limited data with the following service providers solely to operate the website:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email Service:</strong> We use email services (such as SendGrid or SMTP providers) to deliver newsletters and account notifications. Only your email address is shared for this purpose.</li>
                <li><strong>Google Maps:</strong> The neighborhood map uses Google Maps. Google may collect usage data in accordance with the{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">
                    Google Privacy Policy
                  </a>.
                </li>
                <li><strong>Cloudflare Turnstile:</strong> We use Cloudflare Turnstile for bot protection during registration. Cloudflare may collect limited technical data as described in the{' '}
                  <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">
                    Cloudflare Privacy Policy
                  </a>.
                </li>
              </ul>
              <p>We will never share your information with advertisers, data brokers, or any entity not directly involved in operating this community portal.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              5. Data Security
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>We take reasonable measures to protect your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Passwords are hashed using industry-standard bcrypt encryption and are never stored in plain text.</li>
                <li>All data is transmitted over HTTPS (SSL/TLS encryption).</li>
                <li>Two-factor authentication (2FA) is available for additional account security.</li>
                <li>Access to member data is restricted to approved, logged-in members only.</li>
                <li>Administrator access requires elevated role-based permissions.</li>
              </ul>
              <p>
                While we strive to protect your data, no method of internet transmission or electronic storage
                is 100% secure. We cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              6. Cookies &amp; Tracking
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>
                We use essential cookies to maintain your login session and authentication state. We do not
                use third-party tracking cookies, analytics trackers, or advertising cookies. We do not
                engage in behavioral advertising or cross-site tracking.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              7. Newsletter &amp; Email Communications
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>
                Our newsletter uses a double opt-in process. After subscribing, you will receive a
                confirmation email. Your subscription is only activated after you confirm.
              </p>
              <p>
                You may unsubscribe from the newsletter at any time by clicking the &ldquo;Unsubscribe&rdquo;
                link included in every newsletter email.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              8. Children&apos;s Privacy
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>
                This website is not directed at children under the age of 13. We do not knowingly collect
                personal information from children. If we become aware that a child under 13 has provided us
                with personal information, we will take steps to delete it promptly.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              9. Your Rights
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>As a member, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> View all personal information we hold about you through your profile page.</li>
                <li><strong>Correct:</strong> Update or correct your personal information at any time via your profile.</li>
                <li><strong>Delete:</strong> Request deletion of your account and all associated data by contacting the site administrator.</li>
                <li><strong>Opt Out:</strong> Remove yourself from the neighborhood map by clearing your coordinates in your profile.</li>
                <li><strong>Unsubscribe:</strong> Opt out of newsletter communications at any time.</li>
              </ul>
              <p>
                California residents may have additional rights under the California Consumer Privacy Act (CCPA).
                To exercise any privacy rights, please contact the site administrator.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              10. Account Approval &amp; Termination
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>
                All new accounts require administrator approval to verify neighborhood residency. We reserve
                the right to deny or revoke access to any account at our discretion, particularly in cases
                of privacy policy violations or misuse of member data.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              11. Changes to This Policy
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. Any changes will be posted on this page
                with an updated effective date. Continued use of the website after changes constitutes
                acceptance of the revised policy.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="font-serif text-xl text-forest-800 mb-3 pb-2 border-b border-cream-200">
              12. Contact Us
            </h2>
            <div className="space-y-4 font-body text-forest-600 leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or wish to exercise your privacy rights,
                please contact:
              </p>
              <div className="bg-cream-100 border border-cream-200 rounded-sm p-5">
                <p className="font-sans text-sm text-forest-700">
                  <strong>Remo Mattei</strong><br />
                  Hidden Ridge EDH — Site Administrator<br />
                  El Dorado Hills, CA 95762<br />
                  <a href="mailto:remo@remomattei.com" className="text-gold-500 hover:underline">remo@remomattei.com</a>
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
