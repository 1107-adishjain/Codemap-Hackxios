"use client";
import React, { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

const CytoscapeCodeGraph = ({ nodes = [], relationships = [] }) => {
  const cyRef = useRef(null);
  const containerRef = useRef(null);

  const destroyCy = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return destroyCy();

    destroyCy();

    const nodeIds = new Set(nodes.map(n => n.id));
    const safeRelationships = relationships.filter(r => 
      nodeIds.has(r.startNode) && nodeIds.has(r.endNode)
    );

    // 🔥 ULTIMATE DEBUG - Log FIRST 3 nodes
    console.log('🔥 RAW NODES SAMPLE:', nodes.slice(0, 3).map(n => ({
      id: n.id,
      properties: n.properties,
      hasName: !!n.properties?.name,
      nameValue: n.properties?.name
    })));

    // Define a color map for categories (move outside cytoscape config)
    const categoryColors = {
      class: '#6366f1', // indigo
      function: '#10b981', // emerald
      variable: '#f59e42', // orange
      interface: '#f472b6', // pink
      module: '#facc15', // yellow
      file: '#60a5fa', // blue
      unknown: '#64748b', // slate
      // Add more categories as needed
    };

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((n, index) => {
          // 🔥 BULLETPROOF label extraction
          const rawName = n.properties?.name;
          const rawLabel = n.properties?.label;
          const extractedLabel = rawName && rawName.trim() ? rawName.trim() : 
                                (rawLabel && rawLabel.trim() ? rawLabel.trim() : 
                                (n.id?.split('.').pop()?.split('-').pop() || 'Unnamed'));
          const category = rawLabel && rawLabel.trim() ? rawLabel.trim() : 'Unknown';
          // 🔥 DEBUG EVERY NODE
          if (index < 5) {
            console.log(`🔥 NODE ${index}:`, {
              id: n.id,
              rawName,
              rawLabel,
              extractedLabel,
              category,
              fullNode: n
            });
          }
          return {
            data: {
              id: n.id,
              label: extractedLabel,  // 🔥 This MUST be "ApiController"
              displayLabel: extractedLabel,  // 🔥 Backup label field
              category,
              rawName,
              rawLabel,
              ...n.properties
            },
            classes: ['code-node', category.toLowerCase().replace(/\s+/g, '-')]
          };
        }),
        ...safeRelationships.map(r => ({
          data: {
            id: r.id || `edge-${r.startNode}-${r.endNode}`,
            source: r.startNode,
            target: r.endNode,
            label: r.type,
            ...r.properties
          }
        }))
      ],
      style: [
        // Default node style
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px !important',
           
            'color': '#ffffff !important',
            'text-outline-width': 1,
            'text-outline-color': '#6b81b0',
            'background-color': '#7b94d1', // fallback color
            'width': 60,
            'height': 60,
            'min-width': 50,
            'min-height': 50
          }
        },
        // Category-based color overrides
        ...Object.entries(categoryColors).map(([cat, color]) => ({
          selector: `.${cat}`,
          style: { 'background-color': color }
        })),
        // 🔥 BACKUP LABEL - in case data(label) fails
        {
          selector: 'node[rawName]',
          style: {
            'label': 'data(rawName)'
          }
        },
        {
          selector: 'node[displayLabel]',
          style: {
            'label': 'data(displayLabel)'
          }
        },
        // Category shape overrides (optional)
        {
          selector: '.class',
          style: { 'shape': 'ellipse' }
        },
        {
          selector: '.function',
          style: { 'shape': 'circle' }
        },
        // Edges
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#9ca3af',
            'curve-style': 'haystack',
            'label': 'data(label)',
            'font-size': 12,
            'color': '#ffffff',
            'text-background-color': '#374151',
            'text-background-opacity': 0.9
          }
        }
      ],
      layout: {
        name: 'fcose',
        animate: true,
        animationDuration: 800,
        fit: true,
        padding: 20
      }
    });

    // 🔥 FINAL VERIFY - log first few rendered nodes
    setTimeout(() => {
      cyRef.current?.$('node').slice(0, 5).forEach((node, i) => {
        console.log(`🎯 RENDERED NODE ${i}:`, {
          id: node.id(),
          label: node.data('label'),
          rawName: node.data('rawName'),
          renderedText: node.renderedLabel()
        });
      });
    }, 1000);

    cyRef.current.resize();
    cyRef.current.fit();

    return destroyCy;
  }, [nodes, relationships]);

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Code Graph (Check Console F12!)
        </h3>
        <div className="text-xs text-orange-400 font-mono bg-black/50 p-2 rounded">
          Nodes: {nodes.length} | Edges: {relationships.length} | 
          <span className="ml-2 cursor-pointer underline" 
                onClick={() => console.log('ALL NODES:', nodes)}>
            CLICK TO DEBUG
          </span>
        </div>
      </div>
      <div 
        style={{ width: '100%', height: '700px', background: '#0f172a' }} 
        ref={containerRef}
        className="border-4 border-blue-500/50 rounded-xl shadow-2xl"
      />
    </div>
  );
};

export default CytoscapeCodeGraph;
