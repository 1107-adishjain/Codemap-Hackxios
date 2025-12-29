"use client";

export default function Login() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-100">
      <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-md shadow-xl p-8 border border-teal-100">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-teal-700 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Login to continue to <span className="text-teal-600 font-medium">CodeMap</span>
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
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
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm 
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="accent-teal-600" />
              Remember me
            </label>
            <a href="#" className="text-teal-600 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white
                       hover:bg-teal-700 transition-colors shadow-md"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <a href="#" className="text-teal-600 font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
