"use client"
import { useRouter } from "next/navigation";

export default function Navbar() {
    const router = useRouter()
  return (
    <header className="bg-teal-700 flex items-center justify-between w-full px-8 py-4">
      <div className="text-2xl font-bold text-white">CodeMap</div>
      <nav className="flex gap-6 items-center">
        <a href="#" className="text-white hover:underline">Home</a>
        <a href="#" className="text-white hover:underline">About</a>
        <a href="#" className="text-white hover:underline">Services</a>
        <a href="#" className="text-white hover:underline">Contact</a>
       
            <button 
            onClick={() => router.push("/Login")}
            className="bg-white text-teal-700 font-semibold px-4 py-1 rounded-md ml-4">Login</button>
       
   
             <button
             onClick={() => router.push("/Signup")}
             className="bg-teal-500 text-white font-semibold px-4 py-1 rounded-md ml-2">Register</button>
       
       
      </nav>
    </header>
  );
}
