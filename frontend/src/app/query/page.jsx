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
  const [activeTab, setActiveTab] = useState("query"); // "query" | "graph"
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  return (
    <div className="bg-gradient-to-b from-teal-800 to-teal-950 min-h-screen text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Query & Explore</h1>
          <p className="mt-4 text-lg text-gray-300">
            Analyze your codebase and explore the graph
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("query")}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === "query"
                  ? "bg-teal-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              🔍 Query & Analyze
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === "graph"
                  ? "bg-teal-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              🌐 Graph Explorer
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "query" ? (
          <QueryDashboard projectId={projectId} />
        ) : (
          <GraphExplorer projectId={projectId} />
        )}
      </div>
    </div>
  );
}
