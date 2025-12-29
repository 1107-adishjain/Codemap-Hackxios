"use client";

export default function Signup() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-md shadow-xl p-8 border border-teal-100">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-teal-700 tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Join <span className="text-teal-600 font-medium">CodeMap</span> and start building
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use at least 8 characters with a mix of letters & numbers
            </p>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input type="checkbox" className="accent-teal-600 mt-1" />
            <span>
              I agree to the{" "}
              <a href="#" className="text-teal-600 hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-teal-600 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          {/* Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white
                       hover:bg-teal-700 transition-colors shadow-md"
          >
            Create Account
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-teal-600 font-medium hover:underline">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}
