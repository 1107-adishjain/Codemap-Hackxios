"use client";
import Navbar from "@/components/Navbar";
import UploadDashboard from "./UploadDashboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploadType, setUploadType] = useState("zip");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [projects, setProjects] = useState([]);

  // useEffect(() => {
  //   const storedToken = localStorage.getItem("access_token");
  //   if (!storedToken) {
  //     router.push("/Login");
  //     return;
  //   }
  //   setToken(storedToken);
  // }, [router]);

  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:8080/api/v1/projects", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [token]);

  const handleUpload = () => {
    uploadType === "zip" ? handleZipUpload() : handleGithubUpload();
  };

  /* -------- existing upload handlers remain unchanged -------- */

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Upload repositories and explore code structure visually
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Projects */}
          <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-[520px] flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Your Projects</h2>

            <div className="flex-1 overflow-y-auto space-y-3">
              {projects.length === 0 && (
                <p className="text-sm text-gray-500">
                  No projects uploaded yet.
                </p>
              )}

              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    router.push(`/query?projectId=${encodeURIComponent(p.id)}`)
                  }
                  className="cursor-pointer rounded-md border border-neutral-800 p-4
                             hover:border-neutral-600 hover:bg-neutral-800 transition"
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {p.status} · {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <UploadDashboard
              file={file}
              setFile={setFile}
              githubUrl={githubUrl}
              setGithubUrl={setGithubUrl}
              message={message}
              setMessage={setMessage}
              uploadType={uploadType}
              setUploadType={setUploadType}
              loading={loading}
              handleUpload={handleUpload}
            />

            <div className="flex justify-end mt-8">
              <button
                onClick={() => router.push("/query")}
                className="bg-white text-black px-6 py-3 rounded-md font-semibold
                           hover:bg-gray-200 transition"
              >
                Open Query & Graph Explorer
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
