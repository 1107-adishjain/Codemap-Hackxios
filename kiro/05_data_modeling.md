# CodeMap: Data Modeling

**TL;DR:** Code is naturally a graph. Files contain classes, functions call other functions. We model this reality in Neo4j and render it as interactive visualizations.

## Why Graph Modeling for Code?

**The Core Insight:** Software isn't just text files—it's a network of relationships.

```
Traditional View (Files):
📁 src/
├── auth.js
├── user.js
└── config.js

Graph Reality (Relationships):
auth.js ──CONTAINS──▶ LoginFunction ──CALLS──▶ getUser() ──CALLS──▶ loadConfig()
   │                      │                      │              │
   └──CONTAINS──▶ AuthClass └──CALLS──▶ validateToken()        └──IN──▶ config.js
```

**Why This Matters:** Developers think in relationships, not file hierarchies.

## Node Types: The Building Blocks

```
🏗️ CODE ENTITIES AS GRAPH NODES
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  📄 FILE NODE                    🏛️ CLASS NODE                  │
│  ├── name: "auth.js"            ├── name: "AuthService"        │
│  ├── path: "/src/auth.js"       ├── methods: 5                 │
│  ├── size: 1.2KB                ├── visibility: "public"       │
│  └── language: "JavaScript"     └── complexity: "medium"       │
│                                                                 │
│  ⚙️ FUNCTION NODE               🔗 VARIABLE NODE               │
│  ├── name: "validateToken"      ├── name: "API_KEY"           │
│  ├── parameters: ["token"]      ├── type: "string"            │
│  ├── returns: "boolean"         ├── scope: "global"           │
│  └── complexity: 3              └── usage_count: 12           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Relationship Types: How Code Connects

```
🔗 CODE RELATIONSHIPS AS GRAPH EDGES

File Relationships:
📄 auth.js ──CONTAINS──▶ 🏛️ AuthService
📄 auth.js ──CONTAINS──▶ ⚙️ validateToken()

Class Relationships:
🏛️ AuthService ──CONTAINS──▶ ⚙️ login()
🏛️ AuthService ──CONTAINS──▶ ⚙️ logout()
🏛️ UserService ──EXTENDS──▶ 🏛️ BaseService

Function Relationships:
⚙️ login() ──CALLS──▶ ⚙️ validateToken()
⚙️ validateToken() ──CALLS──▶ ⚙️ getEnv()
⚙️ loadConfig() ──CALLS──▶ ⚙️ getEnv()

Data Flow:
⚙️ getUser() ──USES──▶ 🔗 API_KEY
⚙️ saveUser() ──MODIFIES──▶ 🔗 userCache
```

## Real-World Example: Authentication Flow

```
ACTUAL CODEMAP DATA FLOW
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  User Action: "Show me authentication dependencies"             │
│                           ↓                                     │
│  Neo4j Query: MATCH (f:Function {name: "login"})-[:CALLS*]->(d) │
│                           ↓                                     │
│  Graph Result:                                                  │
│                                                                 │
│    login() ──CALLS──▶ validateToken() ──CALLS──▶ getEnv()      │
│       │                     │                      │           │
│       └──CALLS──▶ getUser() └──CALLS──▶ hashPassword()         │
│                     │                                           │
│                     └──CALLS──▶ loadConfig()                   │
│                                                                 │
│  Frontend Rendering: Interactive graph with clickable nodes    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Neo4j to Frontend Transformation

### Backend Graph Data (Neo4j Format)
```json
{
  "nodes": [
    {
      "id": "auth.js",
      "labels": ["File"],
      "properties": {"name": "auth.js", "size": 1200}
    },
    {
      "id": "login",
      "labels": ["Function"], 
      "properties": {"name": "login", "params": 2}
    }
  ],
  "relationships": [
    {
      "id": "rel1",
      "type": "CONTAINS",
      "startNode": "auth.js",
      "endNode": "login"
    }
  ]
}
```

### Frontend Graph Visualization
```
Neo4j Data → Cytoscape.js → Interactive Graph

📄 auth.js ──CONTAINS──▶ ⚙️ login()
    ↓                      ↓
✅ Clickable node      ✅ Hover for details
✅ Color-coded         ✅ Expandable connections
✅ Zoom & pan          ✅ Filter by type
```

## Interactive Features Enabled

```
🎯 USER INTERACTIONS POWERED BY GRAPH MODEL
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🖱️ Click Node → Show all connections                          │
│  🔍 Hover → Display properties and metadata                    │
│  🎛️ Filter → Hide/show specific node types                     │
│  📈 Expand → Follow relationship paths                         │
│  🎨 Color → Distinguish files, classes, functions             │
│  📏 Size → Represent complexity or importance                  │
│                                                                 │
│  Example User Journey:                                          │
│  1. Click "login" function                                      │
│  2. See all functions it calls                                 │
│  3. Hover over "validateToken"                                 │
│  4. View function parameters and complexity                     │
│  5. Follow path to understand authentication flow              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend-Backend Alignment

**Clear Separation of Concerns:**

```
BACKEND RESPONSIBILITY (Neo4j + Go API):
├── ✅ Accurate code analysis and relationship extraction
├── ✅ Complete graph data with all nodes and edges
├── ✅ Rich metadata and properties for each entity
└── ✅ Fast graph queries and traversal operations

FRONTEND RESPONSIBILITY (React + Cytoscape.js):
├── 🎨 Visual rendering and layout algorithms
├── 🖱️ User interaction handling (click, hover, zoom)
├── 🎛️ Filtering and display options
└── 📱 Responsive design and performance optimization
```

**Important Note:** If visualizations appear incomplete, it's a frontend rendering issue, not missing backend data. The graph model contains complete relationship information.

## Summary: Why Graph Modeling Wins

**The Perfect Match:**
- **Code IS a graph** → Graph database stores it naturally
- **Developers think in relationships** → Graph visualization shows them
- **Complex systems need navigation** → Interactive graphs enable exploration

**The Result:** Transform overwhelming codebases into navigable, understandable visual maps that help developers work with confidence.

*Graph modeling doesn't just store code—it reveals the hidden structure that makes complex software systems comprehensible.*