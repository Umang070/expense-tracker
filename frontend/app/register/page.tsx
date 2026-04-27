import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg md:grid-cols-2">
        <div className="hidden bg-slate-900 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
              Expense Tracker
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              Build better
              <br />
              money habits.
            </h1>
          </div>
          <p className="text-sm text-slate-300">
            Create your account to start tracking expenses and insights in one
            place.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <h2 className="text-2xl font-semibold text-slate-900">
              Create account
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Register to manage your expenses securely.
            </p>

            <div className="mt-8">
              <RegisterForm />
            </div>

            <p className="mt-6 text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
