export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Effective Date: 16 November 2025</p>

        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          This Privacy Policy explains how TrueCode ("we", "us", or "our") collects, uses, and protects
          personal information you provide to us via our website, platform, and related services ("Site").
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">What Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>Personal details (such as name, email, and account profile)</li>
            <li>Usage data (such as pages visited, contest participation, and analytics)</li>
            <li>Submissions and feedback provided via forms</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>To provide access to platform features and personalized services</li>
            <li>For analytics, research, and improving the user experience</li>
            <li>To communicate about service updates, contests, and relevant information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Data Sharing & Disclosure</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>We do not sell your personal data.</li>
            <li>
              Data may be shared with trusted service providers for hosting, analytics, and technical
              support (subject to confidentiality agreements).
            </li>
            <li>If required by law, we may disclose information to relevant authorities.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Cookies and Tracking</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>We use cookies and similar technologies for website functionality and analytics.</li>
            <li>Users can manage cookie preferences in browser settings.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Your Rights</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>
              Access, correct, or delete your personal data by contacting us at{' '}
              <a
                href="mailto:ankitwithyou.fam@gmail.com"
                className="text-[var(--primary-500)] hover:underline"
              >
                ankitwithyou.fam@gmail.com
              </a>
            </li>
            <li>Opt out of non-essential communications at any time.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Data Security</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>
              We take reasonable security measures to protect your information against unauthorized
              access and disclosure.
            </li>
            <li>While we strive for industry-best security, no method is 100% secure.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Changes to This Policy</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We may update our Privacy Policy periodically. The date of last revision will be posted at
            the top of this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Contact Us</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            For questions about this policy or your data, email{' '}
            <a
              href="mailto:ankitwithyou.fam@gmail.com"
              className="text-[var(--primary-500)] hover:underline"
            >
              ankitwithyou.fam@gmail.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
