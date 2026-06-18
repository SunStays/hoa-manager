import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-2xl font-bold">H</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">HOA Manager</h1>
        <p className="text-xl text-gray-500 mb-10">
          Professional management platform for Homeowners Associations.
          <br />
          Manage dues, maintenance, documents and residents — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Register your HOA
          </Link>
        </div>
      </div>
    </main>
  );
}
