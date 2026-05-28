export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Terms & Conditions</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Effective Date: 16 November 2025</p>

        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          These Terms and Conditions ("Terms") govern your use of the TrueCode platform ("Site"). By
          using TrueCode, you agree to these Terms.
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">1. Use of Site</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>TrueCode offers DSA practice, contests, and event tracking.</li>
            <li>
              Users must be at least 13 years old, or have parental consent to use the platform.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">2. User Accounts</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>
              You are responsible for maintaining the confidentiality of your account credentials.
            </li>
            <li>Notify us immediately if you suspect unauthorized access.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">3. Submissions and Content</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>
              You retain copyright for your submissions but grant us a license to display, distribute,
              and improve our services with them.
            </li>
            <li>Do not post illegal or offensive material.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">4. Intellectual Property</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>
              All platform features, UI, databases, and problem sets are our intellectual property
              unless stated otherwise.
            </li>
            <li>
              You may not copy, reproduce, or distribute platform content without written consent.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">5. Acceptable Conduct</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>Do not use TrueCode for fraudulent or abusive activities.</li>
            <li>Respect other users and the community.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">6. Limitation of Liability</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            TrueCode is provided on an "as-is" basis. We are not liable for consequential damages
            resulting from use of the Site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">7. Updates and Termination</h2>
          <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] leading-relaxed">
            <li>
              We reserve the right to update, change, or discontinue services at our discretion.
            </li>
            <li>Violation of these Terms may result in account termination.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">8. Governing Law</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            These Terms shall be governed by the laws of India.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">9. Contact</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            For inquiries or issues related to these Terms, contact{' '}
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
