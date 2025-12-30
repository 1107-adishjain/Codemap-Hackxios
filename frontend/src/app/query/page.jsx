"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import Navbar from "@/components/Navbar";
import QueryDashboard from "@/components/QueryDashboard";

const GraphExplorer = dynamic(
  () => import("@/components/GraphExplorer"),
  { ssr: false }
);

export default function QueryExplorePage() {
  const [activeTab, setActiveTab] = useState("query");
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  return (
    <div className="min-h-screen bg-black text-white mt-30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            Query & Explore
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Analyze your codebase and inspect relationships through queries and graphs
          </p>
        </div>

        {/* Tabs */}
        {/* <div className="mb-8 border-b border-gray-800">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("query")}
              className={`pb-3 text-sm transition-all ${
                activeTab === "query"
                  ? "border-b-2 border-white text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Query & Analyze
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`pb-3 text-sm transition-all ${
                activeTab === "graph"
                  ? "border-b-2 border-white text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Graph Explorer
            </button>
          </div>
        </div> */}

        {/* Content Container */}
        <div className="rounded-lg border border-gray-800 bg-neutral-950 p-6">
          {activeTab === "query" ? (
            <QueryDashboard projectId={projectId} />
          ) : (
            <GraphExplorer projectId={projectId} />
          )}
        </div>
      </div>
    </div>
  );
}
