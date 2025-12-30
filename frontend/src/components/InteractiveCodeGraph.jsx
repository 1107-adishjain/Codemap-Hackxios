"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

// const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
//   ssr: false,
// });

const COLORS = {
  File: "#60a5fa",      // blue
  Function: "#34d399",  // green
  Class: "#f59e0b",     // amber
  Variable: "#a78bfa",  // purple
  Package: "#ec4899",   // pink
};

const InteractiveCodeGraph = ({ graphData, onNodeClick }) => {
  const fgRef = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [filters, setFilters] = useState({
    nodeTypes: new Set(["File", "Function", "Class", "Variable", "Package"]),
    linkTypes: new Set(["CALLS", "IMPORTS", "CONTAINS", "HAS_METHOD", "HAS_PARAMETER"]),
    minConnections: 0,
  });
  const [viewMode, setViewMode] = useState("full"); // full, focused, cluster
  const [nodeLimit, setNodeLimit] = useState(100);

  // Filter and process graph data
  const processedData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    // Convert Cytoscape format to ForceGraph format if needed
    let nodes = graphData.nodes || [];
    let links = graphData.edges || graphData.links || [];

    // Convert Cytoscape format
    if (nodes.length > 0 && nodes[0].data) {
      nodes = nodes.map(n => ({
        id: n.data.id,
        label: n.data.label,
        type: n.data.type,
        ...n.data,
      }));
    }

    if (links.length > 0 && links[0].data) {
      links = links.map(l => ({
        source: l.data.source,
        target: l.data.target,
        label: l.data.label || l.data.type,
        type: l.data.type,
        ...l.data,
      }));
    }

    // Apply filters
    nodes = nodes.filter(node => {
      const matchesType = filters.nodeTypes.has(node.type);
      const matchesSearch = !searchTerm || 
        (node.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         node.id?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Count connections
      const connections = links.filter(l => 
        l.source === node.id || l.target === node.id
      ).length;
      const matchesConnections = connections >= filters.minConnections;

      return matchesType && matchesSearch && matchesConnections;
    });

    const nodeIds = new Set(nodes.map(n => n.id));
    links = links.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      return filters.linkTypes.has(link.type) && 
             nodeIds.has(sourceId) && 
             nodeIds.has(targetId);
    });

    // Limit nodes for performance
    const limitedNodes = nodes.slice(0, nodeLimit);
    const limitedNodeIds = new Set(limitedNodes.map(n => n.id));
    const limitedLinks = links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return limitedNodeIds.has(sourceId) && limitedNodeIds.has(targetId);
    });

    return { nodes: limitedNodes, links: limitedLinks };
  }, [graphData, filters, searchTerm, nodeLimit]);

  // Update highlights when selected node changes
  useEffect(() => {
    if (!selectedNode) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const directNeighbors = new Set();
    const relevantLinks = new Set();

    processedData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      if (sourceId === selectedNode.id) {
        directNeighbors.add(targetId);
        relevantLinks.add(link);
      }
      if (targetId === selectedNode.id) {
        directNeighbors.add(sourceId);
        relevantLinks.add(link);
      }
    });

    directNeighbors.add(selectedNode.id);
    setHighlightNodes(directNeighbors);
    setHighlightLinks(relevantLinks);
  }, [selectedNode, processedData]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    if (onNodeClick) onNodeClick(node);
  }, [onNodeClick]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const newSet = new Set(prev[filterType]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [filterType]: newSet };
    });
  };

  const resetView = () => {
    setSelectedNode(null);
    setSearchTerm("");
    fgRef.current?.zoomToFit(400, 50);
  };

  const focusOnNode = (nodeId) => {
    const node = processedData.nodes.find(n => n.id === nodeId);
    if (node) {
      fgRef.current?.centerAt(node.x, node.y, 1000);
      fgRef.current?.zoom(3, 1000);
      setSelectedNode(node);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-gray-800 rounded-lg p-4 shadow-xl max-w-md max-h-[90vh] overflow-y-auto">
        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🔍 Search Nodes
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Node Type Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📊 Node Types
          </label>
          <div className="space-y-1">
            {["File", "Function", "Class", "Variable", "Package"].map(type => (
              <label key={type} className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.nodeTypes.has(type)}
                  onChange={() => toggleFilter("nodeTypes", type)}
                  className="mr-2"
                />
                <span style={{ color: COLORS[type] }}>●</span>
                <span className="ml-1">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Link Type Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🔗 Relationship Types
          </label>
          <div className="space-y-1">
            {["CALLS", "IMPORTS", "CONTAINS", "HAS_METHOD", "HAS_PARAMETER"].map(type => (
              <label key={type} className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.linkTypes.has(type)}
                  onChange={() => toggleFilter("linkTypes", type)}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Node Limit */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🎯 Max Nodes: {nodeLimit}
          </label>
          <input
            type="range"
            min="10"
            max="500"
            value={nodeLimit}
            onChange={(e) => setNodeLimit(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Min Connections */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ⚡ Min Connections: {filters.minConnections}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={filters.minConnections}
            onChange={(e) => setFilters(prev => ({ ...prev, minConnections: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={resetView}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            🔄 Reset View
          </button>
          <button
            onClick={() => fgRef.current?.zoomToFit(400, 50)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            🎯 Fit to Screen
          </button>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
          <p>Nodes: {processedData.nodes.length}</p>
          <p>Links: {processedData.links.length}</p>
          {selectedNode && (
            <p className="mt-2 text-blue-400">
              Selected: {selectedNode.label}
            </p>
          )}
        </div>
      </div>

      {/* Selected Node Info Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg p-4 shadow-xl max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-white">{selectedNode.label}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-sm text-gray-300">
            <p><span className="text-gray-500">Type:</span> {selectedNode.type}</p>
            <p><span className="text-gray-500">ID:</span> {selectedNode.id}</p>
            <p><span className="text-gray-500">Connections:</span> {highlightNodes.size - 1}</p>
            {selectedNode.path && (
              <p className="text-xs text-gray-400 break-all">{selectedNode.path}</p>
            )}
          </div>
        </div>
      )}

      {/* Graph Canvas */}
      <ForceGraph2D
        ref={fgRef}
        graphData={processedData}
        backgroundColor="#111827"
        nodeRelSize={6}
        nodeLabel="label"
        linkLabel="label"
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.15}
        linkColor={(link) => {
          return highlightLinks.has(link) ? "#60a5fa" : "rgba(255,255,255,0.2)";
        }}
        linkWidth={(link) => {
          return highlightLinks.has(link) ? 2 : 1;
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const isHighlighted = highlightNodes.has(node.id);
          const isSelected = selectedNode?.id === node.id;
          
          const size = isSelected ? 8 : isHighlighted ? 6 : 4;
          const color = COLORS[node.type] || "#9ca3af";
          const opacity = !selectedNode || isHighlighted ? 1 : 0.2;

          // Draw node
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          ctx.fill();

          // Draw selection ring
          if (isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Draw label for highlighted nodes
          if (isHighlighted) {
            const label = node.label || node.id;
            const fontSize = 10;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 1;
            ctx.fillText(label, node.x, node.y - size - 8);
          }

          ctx.globalAlpha = 1;
        }}
      />
    </div>
  );
};

export default InteractiveCodeGraph;
