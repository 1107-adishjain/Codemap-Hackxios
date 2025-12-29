"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const InteractiveCodeGraph = dynamic(() => import("./InteractiveCodeGraph"), {
  ssr: false,
});

const GraphExplorer = ({ projectId }) => {
  const [token, setToken] = useState("");
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("access_token"));
    if (projectId) {
      fetchFileRelationshipGraph(projectId);
    }
  }, [projectId]);

  const fetchFileRelationshipGraph = async (projectId) => {
    setLoading(true);
    setError("");
    try {
      const query = `MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(source:File)-[r]-(target:File)-[:BELONGS_TO]->(p) RETURN source, r, target LIMIT 100`;
      const response = await fetch("http://localhost:8080/api/v1/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, params: { projectId } }),
      });
      if (!response.ok) {
        setError("Failed to fetch graph data");
        setLoading(false);
        return;
      }
      const rawData = await response.json();
      setGraphData(convertToGraphFormat(rawData));
    } catch (err) {
      setError("Error loading graph: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Minimal conversion for Neo4j result to Cytoscape format
  const convertToGraphFormat = (neo4jResults) => {
    if (!Array.isArray(neo4jResults)) return { nodes: [], edges: [] };
    const nodes = new Map();
    const edges = [];
    neo4jResults.forEach((row, rowIndex) => {
      ["source", "target"].forEach((key) => {
        const item = row[key];
        if (item && item.elementId) {
          nodes.set(item.elementId, {
            data: {
              id: item.elementId,
              label: item.properties?.path || item.properties?.name || item.elementId,
              type: item.labels?.[0] || "File",
              ...item.properties
            }
          });
        }
      });
      const r = row["r"];
      if (r && r.elementId && row.source && row.target) {
        edges.push({
          data: {
            id: r.elementId,
            source: row.source.elementId,
            target: row.target.elementId,
            label: r.type,
            ...r.properties
          }
        });
      }
    });
    return { nodes: Array.from(nodes.values()), edges };
  };

  // Debug: List all files for the project
  const [debugFiles, setDebugFiles] = useState(null);
  const runDebugQuery = async () => {
    setLoading(true);
    setError("");
    setDebugFiles(null);
    try {
      const query = `MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(f:File) RETURN f LIMIT 20`;
      const response = await fetch("http://localhost:8080/api/v1/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, params: { projectId } }),
      });
      if (!response.ok) {
        setError("Failed to fetch files");
        setLoading(false);
        return;
      }
      const rawData = await response.json();
      setDebugFiles(rawData);
    } catch (err) {
      setError("Error loading files: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🌐 File Relationship Graph</h1>
        {projectId && (
          <div className="mb-4 p-3 bg-teal-900/60 rounded-lg border border-teal-700 text-teal-200">
            <span className="font-semibold">Project ID:</span> <span className="font-mono">{projectId}</span>
            <button
              className="ml-4 px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-sm"
              onClick={runDebugQuery}
            >
              Debug: List Files
            </button>
          </div>
        )}
        {debugFiles && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2">Files in Project</h3>
            <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto max-h-48">
              {JSON.stringify(debugFiles, null, 2)}
            </pre>
          </div>
        )}
        {loading && <div className="text-center py-8">Loading graph...</div>}
        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-4">{error}</div>}
        {graphData && !loading && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Graph Visualization</h3>
                  <p className="text-sm text-gray-400">
                    {graphData.nodes.length} nodes, {graphData.edges.length} edges
                  </p>
                </div>
              </div>
            </div>
            <div style={{ height: '700px' }}>
              <InteractiveCodeGraph 
                graphData={graphData}
                onNodeClick={(node) => {
                  // Optionally handle node click
                }}
              />
            </div>
          </div>
        )}
        {!graphData && !loading && !error && (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-lg">
              No graph data to display. Please select a project to view its file relationships.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphExplorer;
