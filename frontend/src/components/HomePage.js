"use client";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-black text-white px-8 py-20 flex flex-col items-center">
        {/* Hero Content */}
        <div className="max-w-5xl text-center">
          <h1 className="text-6xl font-extrabold tracking-tight mb-6">
            Visualize Your Code with{" "}
            <span className="text-gray-300">CODEmap</span>
          </h1>

          <p className="text-xl text-gray-400 mb-8">
            Understand architecture, dependencies, and relationships — visually.
          </p>

          <p className="text-gray-500 max-w-3xl mx-auto mb-12">
            CODEmap transforms complex codebases into interactive visual maps,
            helping developers analyze structure, explore dependencies, and
            reason about software design with clarity.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-6 justify-center mb-20">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-black px-8 py-4 rounded-md text-lg font-semibold
                         hover:bg-gray-200 transition-all shadow-lg"
            >
              Start Analyzing
            </button>

            <button
              className="border border-gray-600 px-8 py-4 rounded-md text-lg font-medium
                         text-gray-300 hover:bg-gray-900 transition-all"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          <FeatureCard
            title="15+"
            subtitle="Languages Supported"
            description="Analyze multiple programming languages with a unified visualization."
          />

          <FeatureCard
            title="AST-Based"
            subtitle="Deep Code Analysis"
            description="Powered by Abstract Syntax Trees for accurate relationships."
          />

          <FeatureCard
            title="∞"
            subtitle="Unlimited Insights"
            description="Explore dependencies, modules, and flows without limits."
          />
        </div>
      </section>
    </>
  );
}

/* Reusable Card Component */
function FeatureCard({ title, subtitle, description }) {
  return (
    <div
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-8
                 hover:border-neutral-600 transition-all hover:scale-[1.02]"
    >
      <div className="text-4xl font-bold mb-4 text-white">{title}</div>
      <div className="text-lg font-semibold mb-2 text-gray-300">{subtitle}</div>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}
