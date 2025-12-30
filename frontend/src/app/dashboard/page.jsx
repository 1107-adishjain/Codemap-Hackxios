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
  const [uploadType, setUploadType] = useState("zip"); // "zip" or "github"
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setMessage("Please log in to continue.");
      router.push("/Login");
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:8080/api/v1/projects", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []));
  }, [token]);

  const safeParse = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: text || "Unknown error" };
    }
  };

  const handleZipUpload = async () => {
    if (!token) {
      setMessage("Please log in to upload.");
      router.push("/Login");
      return;
    }
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("codebase", file);

      const res = await fetch("http://localhost:8080/api/v1/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: "include",
      });

      const data = await safeParse(res);

      if (res.status === 401) {
        setMessage("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_email");
        setTimeout(() => router.push("/Login"), 2000);
        return;
      }

      if (!res.ok) {
        setMessage("Error: " + (data.error || "Upload failed"));
      } else {
        setMessage(data.message || "Upload successful!");
        if (data.projectId || data.project_id || data.id) {
          // Try all possible keys for project id
          const projectId = data.projectId || data.project_id || data.id;
          router.push(`/query?projectId=${encodeURIComponent(projectId)}`);
        }
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubUpload = async () => {
    if (!token) {
      setMessage("Please log in to upload.");
      router.push("/Login");
      return;
    }
    if (!githubUrl) {
      setMessage("Please enter a GitHub repository URL.");
      return;
    }
    if (!githubUrl.includes("github.com")) {
      setMessage("Please enter a valid GitHub repository URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/github", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: githubUrl }),
        credentials: "include",
      });

      const data = await safeParse(res);

      if (res.status === 401) {
        setMessage("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_email");
        setTimeout(() => router.push("/Login"), 2000);
        return;
      }

      if (!res.ok) {
        setMessage("Error: " + (data.error || "GitHub upload failed"));
      } else {
        setMessage(data.message || "GitHub repository uploaded successfully!");
        if (data.projectId || data.project_id || data.id) {
          // Try all possible keys for project id
          const projectId = data.projectId || data.project_id || data.id;
          router.push(`/query?projectId=${encodeURIComponent(projectId)}`);
        }
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (uploadType === "zip") {
      handleZipUpload();
    } else {
      handleGithubUpload();
    }
  };

  return (
    <>
      <div className="bg-gradient-to-b from-gray-900 to-black min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">
              CodeMap Dashboard
            </h1>
            <p className="mt-4 text-lg text-gray-300">
              Upload your code and explore with intelligent queries
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Projects box on the left */}
            <div className="md:w-1/3 order-2 md:order-1">
              <div className="bg-gray-900 rounded-lg p-8 shadow-lg h-[450px] flex flex-col border border-gray-700">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Your Projects
                </h2>
                <div className="flex-1 overflow-y-auto">
                  <ul className="space-y-4">
                    {projects.map((p) => (
                      <li
                        key={p.id}
                        className="border-b border-gray-700 pb-4 mb-4 last:border-none last:pb-0 last:mb-0"
                      >
                        <a
                          href={`/query?projectId=${encodeURIComponent(p.id)}`}
                          className="block cursor-pointer hover:bg-gray-800 rounded px-2 py-1 transition-colors"
                          title="View project in Query & Graph Explorer"
                        >
                          <strong className="text-lg">{p.name}</strong>{" "}
                          <span className="text-gray-400">({p.status})</span>
                          <br />
                          <span className="text-sm text-gray-500">
                            Uploaded:{" "}
                            {new Date(p.created_at).toLocaleString()}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload section on the right */}
            <div className="flex-1 order-1 md:order-2">
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
              <div className="flex justify-center mt-8">
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch("http://localhost:8080/api/v1/projects", {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                        credentials: "include",
                      });
                      const data = await res.json();
                      const projectsArr = data.projects || [];
                      // Get the most recent project (by created_at or last in array)
                      let latest = null;
                      if (projectsArr.length > 0) {
                        latest = projectsArr.reduce((a, b) =>
                          new Date(a.created_at) > new Date(b.created_at) ? a : b
                        );
                        if (latest.id) {
                          router.push(`/query?projectId=${encodeURIComponent(latest.id)}`);
                        } else {
                          setMessage("No valid project ID found.");
                        }
                      } else {
                        setMessage("No projects found. Please upload a codebase first.");
                      }
                    } catch (err) {
                      setMessage("Error fetching projects: " + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-6 py-3 rounded-md bg-white text-black hover:bg-gray-200 font-semibold transition-colors border border-gray-400"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Go to Query & Graph Explorer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
