"use client";
import { useState } from "react";

export default function UploadDashboard({
  file,
  setFile,
  githubUrl,
  setGithubUrl,
  message,
  setMessage,
  uploadType,
  setUploadType,
  loading,
  handleUpload,
}) {
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white">
            Upload Codebase
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Analyze local archives or GitHub repositories
          </p>
        </div>

        {/* Upload Type Switch */}
        <div className="flex mb-8 border border-neutral-800 rounded-md overflow-hidden">
          <button
            onClick={() => {
              setUploadType("zip");
              setMessage("");
            }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              uploadType === "zip"
                ? "bg-white text-black"
                : "bg-black text-gray-400 hover:text-white"
            }`}
          >
            ZIP Upload
          </button>
          <button
            onClick={() => {
              setUploadType("github");
              setMessage("");
            }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              uploadType === "github"
                ? "bg-white text-black"
                : "bg-black text-gray-400 hover:text-white"
            }`}
          >
            GitHub Repository
          </button>
        </div>

        {/* Upload Content */}
        {uploadType === "zip" ? (
          <div className="mb-6">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".zip"
              id="file-upload"
              className="hidden"
            />

            <label
              htmlFor="file-upload"
              className="block cursor-pointer rounded-lg border border-dashed border-neutral-700
                         px-6 py-10 text-center hover:border-neutral-500 transition"
            >
              <p className="text-sm text-gray-300">
                {file ? file.name : "Click to select a ZIP file"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Upload a compressed codebase for analysis
              </p>
            </label>
          </div>
        ) : (
          <div className="mb-6">
            <input
              type="url"
              placeholder="https://github.com/username/repository"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full rounded-md bg-black border border-neutral-700 px-4 py-2.5
                         text-sm text-white placeholder-gray-500
                         focus:outline-none focus:border-white transition"
            />
            <p className="text-xs text-gray-500 mt-2">
              Public repositories only
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleUpload}
          disabled={loading || (uploadType === "zip" ? !file : !githubUrl)}
          className={`w-full rounded-md py-3 font-semibold transition ${
            loading || (uploadType === "zip" ? !file : !githubUrl)
              ? "bg-neutral-700 text-gray-400 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          {loading
            ? uploadType === "zip"
              ? "Uploading..."
              : "Cloning repository..."
            : "Analyze Codebase"}
        </button>

        {/* Status Message */}
        {message && (
          <div
            className={`mt-6 rounded-md px-4 py-3 text-sm border ${
              message.toLowerCase().includes("error")
                ? "border-red-900/40 bg-red-900/20 text-red-400"
                : "border-green-900/40 bg-green-900/20 text-green-400"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
