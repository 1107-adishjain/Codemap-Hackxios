"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import CytoscapeCodeGraph for Next.js (no SSR)
const CytoscapeCodeGraph = dynamic(() => import("./CytoscapeCodeGraph"), { ssr: false });

// Dynamically import the graph component
// const InteractiveCodeGraph = dynamic(() => import("./InteractiveCodeGraph"), {
//   ssr: false,
// });

const QueryDashboard = ({ projectId }) => {
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, settoken] = useState("");
  
  useEffect(() => {
    settoken(localStorage.getItem("access_token"));
  }, []);

  // Real queries that help users understand their codebase COMPLETELY
  const queryTemplates = [
    // 🔍 UNDERSTANDING: What's in my codebase?
    {
      id: "codebase_overview",
      name: "📊 Codebase Overview",
      description: "Complete summary of your codebase structure",
      icon: "📊",
      category: "🔍 Understanding",
      query: "MATCH (n) RETURN labels(n)[0] as type, count(n) as count ORDER BY count DESC",
      resultType: "table"
    },
    {
      id: "file_languages",
      name: "🌍 Languages Used", 
      description: "Programming languages in your project",
      icon: "🌍",
      category: "🔍 Understanding",
      query: "MATCH (f:File) WHERE f.language IS NOT NULL RETURN f.language as language, count(f) as files ORDER BY files DESC",
      resultType: "table"
    },
    {
      id: "largest_files",
      name: "📈 Largest Files",
      description: "Files with most functions/classes",
      icon: "📈", 
      category: "🔍 Understanding",
      query: "MATCH (f:File)-[:CONTAINS]->(item) WITH f.path as file, count(item) as size ORDER BY size DESC RETURN file, size LIMIT 20",
      resultType: "table"
    },

    // 🔗 CONNECTIONS: How things relate to each other
    {
      id: "complete_graph",
      name: "🌐 Complete Code Graph",
      description: "Full visualization of your codebase relationships", 
      icon: "🌐",
      category: "🔗 Connections",
      query: "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(n)-[r]->(m)-[:BELONGS_TO]->(p) RETURN n, r, m LIMIT 200",
      resultType: "graph"
    },
    {
      id: "file_dependencies",
      name: "📁 File Import Network",
      description: "How files depend on each other",
      icon: "📁",
      category: "🔗 Connections", 
      query: "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(source:File)-[r:IMPORTS]->(target:File)-[:BELONGS_TO]->(p) RETURN source, r, target LIMIT 50",
      resultType: "graph"
    },
    {
      id: "function_network", 
      name: "⚡ Function Call Network",
      description: "Which functions call which functions",
      icon: "⚡",
      category: "🔗 Connections",
      query: "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(caller:Function)-[r:CALLS]->(callee:Function)-[:BELONGS_TO]->(p) RETURN caller, r, callee LIMIT 50",
      resultType: "graph"
    },
    {
      id: "class_hierarchy",
      name: "🏗️ Class & Method Structure", 
      description: "Classes and their methods relationship",
      icon: "🏗️",
      category: "🔗 Connections",
      query: "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(c:Class)-[r:HAS_METHOD]->(m:Function)-[:BELONGS_TO]->(p) RETURN c, r, m LIMIT 40",
      resultType: "graph"
    },

    // 🎯 INSIGHTS: Important patterns and hotspots  
    {
      id: "central_files",
      name: "🔥 Most Important Files",
      description: "Files that many others depend on",
      icon: "🔥",
      category: "🎯 Insights",
      query: "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(f:File)<-[:IMPORTS]-(importer:File)-[:BELONGS_TO]->(p) WITH f, count(importer) as importers WHERE importers > 1 RETURN f.path as file, importers ORDER BY importers DESC LIMIT 15",
      resultType: "table"
    },
    {
      id: "popular_functions",
      name: "⭐ Most Called Functions", 
      description: "Functions used throughout your codebase",
      icon: "⭐",
      category: "🎯 Insights",
      query: "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(fn:Function)<-[:CALLS]-(caller:Function)-[:BELONGS_TO]->(p) WITH fn, count(caller) as calls WHERE calls > 1 RETURN fn.name as function, calls ORDER BY calls DESC LIMIT 15",
      resultType: "table"
    },
    {
      id: "isolated_components",
      name: "🏝️ Isolated Components",
      description: "Files or functions with no connections",
      icon: "🏝️", 
      category: "🎯 Insights",
      query: "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(n) WHERE NOT (n)--() RETURN labels(n)[0] as type, n.name as name, n.path as path LIMIT 20",
      resultType: "table"
    },

    // 🔬 EXPLORATION: Deep dive into specific areas
    {
      id: "exported_items",
      name: "🚀 Public API Surface",
      description: "All exported functions and classes",
      icon: "🚀",
      category: "🔬 Exploration", 
      query: "MATCH (n) WHERE n.is_exported = true RETURN labels(n)[0] as type, n.name as name ORDER BY type, name",
      resultType: "table"
    },
    {
      id: "file_contents",
      name: "📋 File Contents Breakdown",
      description: "What each file contains (functions, classes)",
      icon: "📋",
      category: "🔬 Exploration",
      query: "MATCH (f:File)-[:CONTAINS]->(item) RETURN f.path as file, labels(item)[0] as contains, item.name as name ORDER BY file LIMIT 100", 
      resultType: "table"
    }
  ];

  const categories = [...new Set(queryTemplates.map(q => q.category))];

  // Transform Neo4j raw response to { nodes, edges } for graph queries
  function transformNeo4jResponse(rawData) {
    if (!Array.isArray(rawData)) return { nodes: [], edges: [] };
    const nodesMap = new Map(); // string id -> node
    const idLookup = new Map(); // numeric Id -> string id
    const edges = [];

    rawData.forEach(item => {
      // Extract nodes (m, n, caller, callee, c, source, target)
      ["m", "n", "caller", "callee", "c", "source", "target"].forEach(key => {
        if (item[key]) {
          const node = item[key];
          const stringId = node.Props && node.Props.id;
          const numericId = node.Id;
          if (stringId && !nodesMap.has(stringId)) {
            // Always set a name property for CytoscapeCodeGraph
            const name = node.Props?.name || node.Props?.label || stringId;
            nodesMap.set(stringId, {
              id: stringId,
              label: node.Labels ? node.Labels[0] : '',
              ...node.Props,
              name
            });
          }
          if (numericId && stringId) {
            idLookup.set(numericId, stringId);
          }
        }
      });
      // Extract edge (r)
      if (item.r) {
        edges.push({
          id: item.r.Id,
          source: idLookup.get(item.r.StartId) || item.r.StartId,
          target: idLookup.get(item.r.EndId) || item.r.EndId,
          type: item.r.Type,
          ...item.r.Props
        });
      }
    });
    return {
      nodes: Array.from(nodesMap.values()),
      edges
    };
  }

  // Convert Neo4j results to graph format for InteractiveCodeGraph
  const getGraphData = () => {
    if (!results || results.error) return { nodes: [], edges: [] };
    // If results is already in {nodes, edges} format (graph query)
    if (results.nodes && results.edges) {
      return results;
    }
    // If results is a raw Neo4j array for a graph query
    if (Array.isArray(results) && results.length > 0 && (results[0].m || results[0].n || results[0].r || results[0].caller || results[0].callee || results[0].c || results[0].source || results[0].target)) {
      return transformNeo4jResponse(results);
    }
    // Otherwise, fallback to empty graph (for table queries)
    return { nodes: [], edges: [] };
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Use a more subtle notification
      const notification = document.createElement('div');
      notification.textContent = 'Copied to clipboard';
      notification.className = 'fixed top-4 right-4 bg-white text-black px-4 py-2 rounded-lg shadow-xl z-50 font-medium';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const executeQuery = async (template) => {
    setLoading(true);
    setSelectedQuery(template);

    try {
      // Build the URL with projectId as a query parameter if present
      let url = "http://localhost:8080/api/v1/query";
      if (projectId) {
        const encoded = encodeURIComponent(projectId);
        url += `?projectId=${encoded}`;
      }
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: template.query,
          params: {}
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        console.error("Query failed:", data.error);
        setResults({ error: data.error });
      }
    } catch (error) {
      console.error("Network error:", error);
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;
    
    if (results.error) {
      return (
        <div className="bg-linear-to-r from-red-500/10 to-red-600/10 border border-red-400/50 backdrop-blur-sm text-red-100 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Query Error</h3>
              <p className="text-red-100/80">{results.error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedQuery?.resultType === "table") {
      if (!Array.isArray(results)) {
        return (
          <div className="bg-linear-to-r from-red-500/10 to-red-600/10 border border-red-400/50 backdrop-blur-sm text-red-100 p-6 rounded-2xl shadow-2xl">
            <p>Error: Unexpected backend response for table query.</p>
          </div>
        );
      }
      return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold bg-linear-to-r from-white to-gray-200 bg-clip-text text-transparent">
              {selectedQuery.name} Results
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => downloadJSON(results, `${selectedQuery.id}-results.json`)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10l-5.5 5.5m0 0L12 21l5.5-5.5m-5.5 5.5V8a1 1 0 011-1h6" />
                </svg>
                <span>Download</span>
              </button>
              <button 
                onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 backdrop-blur-sm">
                  {results.length > 0 && Object.keys(results[0]).map(key => (
                    <th key={key} className="text-left p-4 font-semibold text-white/90 border-b border-white/10">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="p-4 text-white/80 font-mono">{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.length === 0 && (
            <div className="text-center py-16 text-white/50">
              <p className="text-lg">No results found</p>
            </div>
          )}
        </div>
      );
    }

    // For graph results, show interactive visualization
    const graphData = getGraphData();
    
    const graphDataForCytoscape = {
      nodes: (graphData.nodes || []).map(n => ({
        id: n.id,
        labels: n.labels || [n.type],
        properties: { ...n, name: n.name || n.label || n.id }
      })),
      relationships: (graphData.edges || graphData.links || []).map(e => ({
        id: e.id || `${e.source}-${e.target}`,
        type: e.type,
        startNode: typeof e.source === 'object' ? e.source.id : e.source,
        endNode: typeof e.target === 'object' ? e.target.id : e.target,
        properties: { ...e }
      }))
    };
    
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-1">
              {selectedQuery.name}
            </h3>
            <p className="text-white/60 text-sm font-medium">{graphDataForCytoscape.nodes.length} nodes, {graphDataForCytoscape.relationships.length} relationships</p>
          </div>
          <div className="flex space-x-3 flex-wrap gap-2">
            <button 
              onClick={() => downloadJSON(graphDataForCytoscape, `${selectedQuery.id}-graph.json`)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10l-5.5 5.5m0 0L12 21l5.5-5.5m-5.5 5.5V8a1 1 0 011-1h6" />
              </svg>
              <span>Export Graph</span>
            </button>
            <button 
              onClick={() => copyToClipboard(JSON.stringify(graphDataForCytoscape, null, 2))}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Data</span>
            </button>
          </div>
        </div>

        {/* Cytoscape Graph */}
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: '650px' }}>
          <CytoscapeCodeGraph 
            nodes={graphDataForCytoscape.nodes}
            relationships={graphDataForCytoscape.relationships}
          />
        </div>

        {/* Expandable Raw Data */}
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-white/50 hover:text-white font-medium py-3 px-4 border border-white/20 rounded-2xl bg-white/5 backdrop-blur-sm transition-all duration-200 hover:bg-white/10">
            📊 View Raw Data ({graphDataForCytoscape.nodes.length} nodes, {graphDataForCytoscape.relationships.length} relationships)
          </summary>
          <div className="mt-4 p-6 bg-white/2 backdrop-blur-sm border border-white/10 rounded-2xl">
            <pre className="text-xs overflow-auto max-h-80 font-mono text-white/70">
              {JSON.stringify(graphDataForCytoscape, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Gradient Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120,119,198,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120,219,255,0.1) 0%, transparent 50%)
          `
        }} />
      </div>

      <div className="max-w-7xl mx-auto p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-3xl mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-white/20 to-transparent rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">
                Codebase Analysis
              </h1>
              <p className="text-xl text-white/60 font-medium mt-2 tracking-wide">Interactive graph queries & insights</p>
            </div>
          </div>
        </div>

        {/* Analysis Categories */}
        {categories.map((category, categoryIndex) => (
          <div key={category} className="mb-24 last:mb-0">
            <div className="flex items-center space-x-4 mb-12">
              <div className="w-12 h-12 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                {category === "🔍 Understanding" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                {category === "🔗 Connections" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                {category === "🎯 Insights" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                {category === "🔬 Exploration" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                {category}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {queryTemplates
                .filter(template => template.category === category)
                .map((template, index) => (
                  <div
                    key={template.id}
                    onClick={() => executeQuery(template)}
                    className={`group relative overflow-hidden bg-white/5 backdrop-blur-xl hover:bg-white/10 border border-white/20 hover:border-white/40 p-8 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/10 ${loading && selectedQuery?.id === template.id ? 'ring-4 ring-white/30 scale-105' : ''}`}
                  >
                    {/* Active indicator */}
                    {loading && selectedQuery?.id === template.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse rounded-3xl" />
                    )}
                    
                    <div className="relative z-10">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/20 group-hover:border-white/40 shrink-0">
                          <span className="text-xl group-hover:scale-110 transition-transform duration-300">{template.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl text-white mb-2 leading-tight group-hover:text-gray-100 transition-colors">{template.name}</h3>
                          <p className="text-white/60 text-sm leading-relaxed">{template.description}</p>
                          
                          <div className="inline-flex mt-4 items-center space-x-2">
                            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-semibold rounded-full border border-white/20 group-hover:bg-white/20 group-hover:border-white/40 transition-all duration-300">
                              {template.resultType === 'table' ? '📋 Table' : '📈 Graph'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover effect glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-24 mx-auto max-w-2xl">
            <div className="w-24 h-24 border-4 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-8 shadow-2xl"></div>
            <h3 className="text-2xl font-bold text-white/80 mb-2">Executing "{selectedQuery?.name}"</h3>
            <p className="text-white/50">Analyzing your codebase...</p>
            <div className="flex justify-center space-x-1 mt-6">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && renderResults()}
      </div>
    </div>
  );
};

export default QueryDashboard;
