import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream-100 bg-talavera px-6 text-center text-brown-900">
      <p className="eyebrow text-clay-600">404</p>
      <h1 className="mt-4 font-display text-5xl">That page isn&apos;t on the menu.</h1>
      <p className="mt-4 max-w-md text-brown-700">The page you&apos;re looking for doesn&apos;t exist. Head back home and grab a table.</p>
      <Link href="/" className="mt-8 rounded-full bg-clay-600 px-6 py-3 font-semibold text-cream-50 hover:bg-clay-500">
        Back home
      </Link>
    </main>
  );
}
