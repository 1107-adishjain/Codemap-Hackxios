# CodeMap: System Flows

**TL;DR:** Real-time execution flows from user upload to interactive insights. Sequential processing with clear failure handling and performance guarantees.

## Purpose of System Flows

This document shows CodeMap in motion—how the system actually executes from user action to delivered insight. While the architecture document defines components and responsibilities, this document traces the runtime behavior, execution order, and user experience as currently implemented.

Focus: Operational reality, not design theory. Performance characteristics, not technology choices. System behavior under real-world conditions.

## User Journey: From Upload to Insight

**Complete User Experience Flow:**

1. **User accesses CodeMap interface** → Clean upload form with GitHub URL or ZIP options
2. **User provides repository source** → Input validation happens instantly in browser
3. **User clicks "Analyze"** → Loading indicator appears, analysis begins
4. **User waits during processing** → Basic progress indication shows analysis is running
5. **User sees complete graph** → Full dependency structure renders after analysis completes
6. **User explores interactively** → Click nodes, view relationships, basic filtering
7. **User gains architectural insights** → Understands system structure and dependencies
8. **User makes informed code decisions** → Armed with dependency visibility

**User-Perceived Timeline:**
- **0-5 seconds:** Input validation and job creation
- **5-60 seconds:** Analysis and graph construction (varies by repo size)
- **60+ seconds:** Interactive exploration and insight discovery

## Source Code Ingestion Flow

### GitHub Repository Processing

1. **URL Validation**
   - Check GitHub URL format and accessibility
   - Verify repository exists and is publicly accessible
   - Generate unique project identifier

2. **Repository Download**
   - Clone repository to temporary workspace
   - Extract all source files to analysis directory
   - Create project metadata (name, size, file count)

3. **Workspace Setup**
   - Organize files by language and directory structure
   - Filter out binary files, build artifacts, and dependencies
   - Prepare file list for sequential analysis

### ZIP Upload Processing

1. **File Upload Handling**
   - Receive ZIP file through secure upload endpoint
   - Validate file size limits (currently 100MB max)
   - Store temporarily with unique identifier

2. **Archive Extraction**
   - Extract ZIP contents to isolated workspace
   - Maintain original directory structure
   - Scan for nested archives and handle appropriately

3. **Content Validation**
   - Verify extracted content contains source code
   - Check for supported file types and languages
   - Reject uploads with only binary or unsupported content

## Analysis Execution Flow

### Language Detection Process

1. **File Extension Mapping**
   - Scan all files and categorize by extension
   - Map extensions to supported language parsers
   - Identify mixed-language projects and primary languages

2. **Parser Selection**
   - Choose appropriate parser for each file type
   - Load language-specific parsing configurations
   - Initialize parser instances with project context

### Sequential File Processing

1. **File Processing Order**
   - Process files in dependency order when possible
   - Start with entry points and configuration files
   - Handle remaining files in alphabetical order

2. **Individual File Analysis**
   - Parse file to extract syntax tree
   - Identify functions, classes, variables, and imports
   - Extract relationships and dependencies
   - Generate metadata (complexity, coupling metrics)

3. **Failure Isolation**
   - Continue processing if individual files fail to parse
   - Log parsing errors with file context
   - Maintain partial results for successful files
   - Report completion percentage to user

### Cross-File Relationship Resolution

1. **Import Resolution**
   - Map import statements to actual files
   - Resolve relative and absolute import paths
   - Handle language-specific module systems

2. **Function Call Mapping**
   - Connect function calls to their definitions
   - Track cross-file function dependencies
   - Identify external library usage

## Graph Construction Flow

### Node Creation Process

1. **Entity Node Generation**
   - Create nodes for files, functions, classes, variables
   - Assign unique identifiers and node types
   - Add metadata properties (size, complexity, visibility)

2. **Batch Node Writing**
   - Group nodes by type for efficient database writes
   - Write nodes in batches of 1000 to optimize performance
   - Verify node creation and handle write failures

### Relationship Edge Creation

1. **Relationship Mapping**
   - Generate edges for calls, imports, dependencies, inheritance
   - Calculate edge properties (strength, frequency, type)
   - Ensure bidirectional relationships where appropriate

2. **Batch Edge Writing**
   - Write edges in batches after all nodes exist
   - Verify source and target nodes exist before edge creation
   - Handle orphaned edges and missing node references

### Consistency and Idempotency

1. **Transaction Management**
   - Wrap graph writes in database transactions
   - Rollback on failure to maintain consistency
   - Support re-running analysis without duplicates

2. **Duplicate Prevention**
   - Check for existing project data before writing
   - Clear previous analysis results for re-analyzed projects
   - Maintain unique constraints on node and edge identifiers

## Query → Insight Flow

### User Action Processing

1. **Frontend Interaction Capture**
   - User clicks node, applies filter, or requests expansion
   - Frontend generates specific graph query parameters
   - Query sent to backend with project context

2. **Query Translation**
   - Convert UI actions to graph database queries
   - Apply user filters and scope limitations
   - Optimize query for performance and result size

### Backend Query Execution

1. **Graph Database Queries**
   - Execute traversal queries for dependency analysis
   - Retrieve node properties and relationship data
   - Apply pagination for large result sets

2. **Result Processing**
   - Format query results for frontend consumption
   - Filter sensitive or irrelevant information

3. **Response Optimization**
   - Return structured JSON with metadata

## Interactive Visualization Flow

### Initial Graph Rendering

1. **Data Preparation**
   - Receive graph data from backend query
   - Process nodes and edges for visualization library
   - Calculate layout and positioning

2. **Complete Graph Rendering**
   - Render full graph structure at once
   - Display all nodes and relationships
   - Apply basic layout algorithm for readability

### User Interaction Handling

1. **Node Selection**
   - User clicks node to view details
   - System highlights selected node and immediate connections
   - Node information displayed in side panel

2. **Basic Navigation**
   - User can pan and zoom the graph view
   - System maintains view state during interactions
   - Basic node filtering by type or name

3. **Relationship Exploration**
   - User follows edges to explore relationships
   - System highlights connection paths
   - Click edges to see relationship details

### Real-Time Responsiveness

1. **Interaction Feedback**
   - Immediate visual feedback for user clicks and selections
   - Loading indicators for any backend-dependent operations
   - Basic animations for node selection and highlighting

2. **Performance Considerations**
   - Graph rendering optimized for typical repository sizes
   - Smooth pan and zoom operations
   - Efficient re-rendering on user interactions

## Failure & Edge Case Handling

### Large Repository Processing

**Challenge:** Repositories with 10,000+ files or 1GB+ codebases
**Handling:**
- Process files in smaller batches (100 files per batch)
- Provide detailed progress updates to user
- Allow partial results if processing time exceeds limits
- Implement timeout protection (max 10 minutes analysis)

### Unsupported Language Handling

**Challenge:** Files in languages without parsers
**Handling:**
- Skip unsupported files with clear logging
- Continue analysis with supported files
- Report language coverage in results
- Suggest manual review for unsupported components

### Partial Parse Failures

**Challenge:** Syntax errors or corrupted files
**Handling:**
- Isolate failures to individual files
- Continue processing remaining files
- Report parsing success rate to user
- Provide error details for failed files

### Network and Infrastructure Failures

**Challenge:** GitHub API limits, database connectivity issues
**Handling:**
- Retry failed operations with exponential backoff
- Graceful degradation with cached or partial data
- Clear error messages with suggested user actions
- Automatic recovery when services restore

## Performance & Responsiveness Guarantees

### Backend Processing Efficiency

**Sequential Processing Model:**
- Files processed one at a time to ensure consistency
- No complex job queue or async processing overhead
- Predictable resource usage and memory management
- Clear progress tracking and user feedback

**Performance Targets:**
- Small repos (< 100 files): 15-30 seconds
- Medium repos (100-1000 files): 30-90 seconds
- Large repos (1000+ files): 90-300 seconds

### User Interface Responsiveness

**Immediate Feedback:**
- User interactions respond quickly for basic operations
- Loading states indicate when system is processing
- Basic progress indication during analysis
- Error messages provide guidance when issues occur

**Operations That May Block:**
- Initial analysis requires user to wait for completion
- Large graph rendering may take several seconds
- Complex repository analysis may require extended wait times

### Scalability Characteristics

**Current Implementation:**
- Handles typical repository sizes effectively
- Processing time scales with codebase complexity
- Memory usage increases with repository size
- Single-user analysis workflow

**Resource Management:**
- Memory usage scales with codebase size
- Database storage grows with analyzed code volume
- CPU usage peaks during parsing phase
- Network usage optimized for typical repository sizes

## End-to-End Flow Recap

**Complete System Execution Sequence:**

1. **User Input** → Repository URL or ZIP file provided
2. **Validation** → Input checked, project created, workspace prepared
3. **Ingestion** → Source code downloaded/extracted to analysis environment
4. **Language Detection** → File types identified, parsers selected
5. **Sequential Analysis** → Files processed one by one, entities extracted
6. **Relationship Resolution** → Cross-file dependencies mapped and verified
7. **Graph Construction** → Nodes and edges written to database in batches
8. **Initial Query** → Graph structure retrieved for visualization
9. **Frontend Rendering** → Complete graph displayed to user
10. **User Exploration** → Click, select, and view operations provide immediate insights
11. **Insight Delivery** → User gains architectural understanding and makes informed decisions

**System State at Each Step:**
- **Steps 1-3:** User waits, sees basic loading indication
- **Steps 4-7:** Backend processing, user waits for completion
- **Steps 8-9:** Results appear, basic interaction enabled
- **Steps 10-11:** Full interactivity available for exploration

**Failure Recovery:** System maintains partial results and clear error reporting at every step, ensuring users always receive maximum possible value even when complete analysis isn't feasible.