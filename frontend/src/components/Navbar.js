"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../app/context/Authcontext";

export default function Navbar() {
  const router = useRouter();
  const { auth, logout } = useAuth();
  const email = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;

  return (
    <header className="fixed top-0 z-50 w-full bg-black/80 backdrop-blur border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => router.push("/")}
          className="text-2xl font-extrabold tracking-tight cursor-pointer"
        >
          <span className="text-white">CODE</span>
          <span className="text-gray-400">map</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink label="Home" />
          <NavLink label="About" />
          <NavLink label="Services" />
          <NavLink label="Contact" />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {auth && auth.loggedIn ? (
            <>
              <span className="text-teal-300 font-semibold mr-2">{email || 'User'}</span>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/Login")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/Signup")}
                className="bg-white text-black px-5 py-2 rounded-md font-semibold hover:bg-gray-200 transition-all"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


/* Reusable Nav Link */
function NavLink({ label }) {
  return (
    <span
      className="text-gray-400 hover:text-white transition-colors cursor-pointer
                 relative after:absolute after:left-0 after:-bottom-1
                 after:h-[1px] after:w-0 after:bg-white
                 hover:after:w-full after:transition-all"
    >
      {label}
    </span>
  );
}
