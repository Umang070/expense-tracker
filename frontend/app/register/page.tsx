import Link from "next/link";

export default function RegisterPlaceholderPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Register</h1>
        <p className="mt-2 text-slate-600">
          Registration page will be implemented in the next step.
        </p>
        <Link href="/login" className="mt-6 inline-block text-blue-600">
          Back to login
        </Link>
      </section>
    </main>
  );
}
