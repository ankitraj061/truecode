import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-brand font-bold text-7xl">404</p>
        <h1 className="mt-4 text-2xl font-bold text-primary">Page not found</h1>
        <p className="mt-2 text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-block mt-6 px-6 py-3">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
