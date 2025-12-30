package main

import (
	"archive/zip"
	"github.com/1107-adishjain/codemap/internal/analysis"
	middlewares "github.com/1107-adishjain/codemap/internal/middleware"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// healthCheckHandler is a simple handler to confirm the API is running.
func (app *application) healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]string{
		"status":      "available",
		"environment": "development",
		"version":     "1.0.0",
	}
	app.writeJSON(w, http.StatusOK, data)
}

// uploadHandler handles the file upload and analysis process.
func (app *application) uploadHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(300 << 20); err != nil { // 300MB max of zip file the user can upload
		app.errorResponse(w, r, http.StatusBadRequest, "Could not parse multipart form.")
		return
	}
	file, handler, err := r.FormFile("codebase")
	if err != nil {
		app.errorResponse(w, r, http.StatusBadRequest, "Could not retrieve the file from form.")
		return
	}
	defer file.Close()
	// Use configured path for temporary uploads
	tempDir, err := os.MkdirTemp(app.config.TempUploads, "codemap-upload-*")
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "Could not create temp directory.")
		return
	}
	defer os.RemoveAll(tempDir)
	zipPath := filepath.Join(tempDir, handler.Filename)
	tempFile, err := os.Create(zipPath)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "Could not create temp file.")
		return
	}
	// Stream file to local temp file first (better for large files)
	_, err = io.Copy(tempFile, file)
	tempFile.Close()
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "Could not save uploaded file.")
		return
	}

	// Read file for S3 upload (now from disk, not memory)
	zipData, err := os.ReadFile(zipPath)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "Could not read temp file.")
		return
	}

	// Upload to S3
	s3Key, err := app.s3.UploadZipFile(zipData, handler.Filename)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to upload to S3: %v", err))
		return
	}
	// add the logic of adding the project in the database after successful upload to s3
	userID, ok := r.Context().Value(middlewares.UserIDKey).(string)
	if !ok {
		app.errorResponse(w, r, http.StatusUnauthorized, "User ID not found in context")
		return
	}

	projectID, err := app.db.CreateProject(userID, handler.Filename, s3Key)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to add project to database: %v", err))
		return
	}

	app.logger.Printf("📤 Uploaded %s to S3: %s (Size: %d bytes)", handler.Filename, s3Key, len(zipData))
	unzipDest := filepath.Join(tempDir, "unzipped")
	if err := unzip(zipPath, unzipDest); err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to unzip file: %v", err))
		return
	}
	// Pass the configured tools path and the unzipped directory to the runner
	analysisResult, err := analysis.Run(app.config.ToolsPath, unzipDest)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, err.Error())
		return
	}
	// Import the result into Neo4j
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute) // 15-minute timeout for import
	defer cancel()
	if err := app.db.ImportAnalysis(ctx, analysisResult, projectID, handler.Filename); err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to import data to Neo4j: %v", err))
		return
	}
	// update project status to 'completed'
	if err := app.db.UpdateProjectStatus(projectID, "completed"); err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to update project status: %v", err))
		return
	}
	app.logger.Printf("✅ Analysis and import completed for project ID: %s", projectID)

	// Send a success response
	app.writeJSON(w, http.StatusAccepted, map[string]string{
		"message": "Upload successful. Codebase has been analyzed and imported.",
		"s3_key":  s3Key,
	})
}

func (app *application) githubHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		RepoURL string `json:"repo_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		app.errorResponse(w, r, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if payload.RepoURL == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "Repository URL is required")
		return
	}

	if !strings.Contains(payload.RepoURL, "github.com") {
		app.errorResponse(w, r, http.StatusBadRequest, "Please provide a valid GitHub repository URL")
		return
	}

	// Upload GitHub repo to S3 and get the local temp directory path
	s3Key, tempDir, err := app.s3.UploadGitRepo(payload.RepoURL)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to clone and upload repository: %v", err))
		return
	}
	userID, ok := r.Context().Value(middlewares.UserIDKey).(string)
	if !ok {
		app.errorResponse(w, r, http.StatusUnauthorized, "User ID not found in context")
		return
	}

	repoName := extractRepoName(payload.RepoURL)
	projectID, err := app.db.CreateProject(userID, repoName, s3Key)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to add project to database: %v", err))
		return
	}
	// Clean up temp directory after we are done
	defer os.RemoveAll(tempDir)

	app.logger.Printf("📤 Uploaded GitHub repo to S3: %s", s3Key)

	analysisResult, err := analysis.Run(app.config.ToolsPath, tempDir)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Analysis failed: %v", err))
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()
	// Import analysis results into Neo4j
	if err := app.db.ImportAnalysis(ctx, analysisResult, projectID, repoName); err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to import analysis to Neo4j: %v", err))
		return
	}

	// update project status to 'completed'
	if err := app.db.UpdateProjectStatus(projectID, "completed"); err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to update project status: %v", err))
		return
	}
	app.logger.Printf("✅ Analysis and import completed for project ID: %s", projectID)

	// Send success response
	app.writeJSON(w, http.StatusAccepted, map[string]string{
		"message":  "GitHub repository analyzed and imported to Neo4j successfully.",
		"s3_key":   s3Key,
		"repo_url": payload.RepoURL,
	})
}

// queryHandler accepts a POST request with a Cypher query and returns the result.
func (app *application) queryHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Query  string         `json:"query"`
		Params map[string]any `json:"params"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		app.errorResponse(w, r, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Get projectID from query parameter
	projectID := r.URL.Query().Get("projectId")
	if projectID != "" {
		if payload.Params == nil {
			payload.Params = make(map[string]any)
		}
		payload.Params["projectId"] = projectID
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	results, err := app.db.Query(ctx, payload.Query, payload.Params)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, fmt.Sprintf("Failed to execute query: %v", err))
		return
	}

	// Debug: Print the raw Neo4j query results to the server log for analysis
	app.logger.Printf("[DEBUG] Raw Neo4j query results: %+v", results)

	// Detect if this is a graph query (contains nodes/edges/relationships)
	isGraph := false
	for _, row := range results {
		for _, v := range row {
			if node, ok := v.(map[string]any); ok && (node["Labels"] != nil || node["Type"] != nil) {
				isGraph = true
				break
			}
		}
		if isGraph {
			break
		}
	}

	if isGraph {
		nodeMap := make(map[string]map[string]any)
		edgeMap := make(map[string]map[string]any)

		for _, row := range results {
			for _, v := range row {
				if node, ok := v.(map[string]any); ok && node["Labels"] != nil {
					id := fmt.Sprintf("%v", node["Id"])
					if _, exists := nodeMap[id]; !exists {
						props := map[string]any{}
						if p, ok := node["Props"].(map[string]any); ok {
							for pk, pv := range p {
								props[pk] = pv
							}
						}
						labels := node["Labels"].([]any)
						label := ""
						if len(labels) > 0 {
							label = fmt.Sprintf("%v", labels[0])
						}
						// Always include the 'name' property if present, for function/class nodes
						name := ""
						if n, ok := props["name"]; ok {
							name = fmt.Sprintf("%v", n)
						}
						nodeMap[id] = map[string]any{
							"id":    id,
							"label": label,
							"type":  label,
							"name":  name,
						}
						for pk, pv := range props {
							nodeMap[id][pk] = pv
						}
					}
				} else if edge, ok := v.(map[string]any); ok && edge["Type"] != nil && edge["StartId"] != nil && edge["EndId"] != nil {
					id := fmt.Sprintf("%v", edge["Id"])
					if _, exists := edgeMap[id]; !exists {
						props := map[string]any{}
						if p, ok := edge["Props"].(map[string]any); ok {
							for pk, pv := range p {
								props[pk] = pv
							}
						}
						edgeMap[id] = map[string]any{
							"id":     id,
							"source": fmt.Sprintf("%v", edge["StartId"]),
							"target": fmt.Sprintf("%v", edge["EndId"]),
							"label":  fmt.Sprintf("%v", edge["Type"]),
							"type":   fmt.Sprintf("%v", edge["Type"]),
						}
						for pk, pv := range props {
							edgeMap[id][pk] = pv
						}
					}
				}
			}
		}
		nodes := make([]map[string]any, 0, len(nodeMap))
		for _, n := range nodeMap {
			nodes = append(nodes, n)
		}
		edges := make([]map[string]any, 0, len(edgeMap))
		for _, e := range edgeMap {
			edges = append(edges, e)
		}
		response := map[string]any{
			"nodes": nodes,
			"edges": edges,
		}
		app.writeJSON(w, http.StatusOK, response)
	} else {
		// Return raw results for table queries
		app.writeJSON(w, http.StatusOK, results)
	}
}

// graphSummaryHandler returns high-level statistics about the codebase graph
func (app *application) graphSummaryHandler(w http.ResponseWriter, r *http.Request) {
	query := `
		MATCH (n)
		WITH labels(n)[0] as nodeType, count(n) as count
		RETURN nodeType, count
		ORDER BY count DESC
	`
	app.runGraphQuery(w, r, query, map[string]any{}, 10*time.Second, "summary")
}

// graphNodeDetailsHandler returns detailed information and connections for a specific node
func (app *application) graphNodeDetailsHandler(w http.ResponseWriter, r *http.Request) {
	nodeID := r.URL.Query().Get("id")
	if nodeID == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "Node ID is required")
		return
	}
	query := `
		MATCH (n)
		WHERE elementId(n) = $nodeId OR n.id = $nodeId OR n.name = $nodeId
		OPTIONAL MATCH (n)-[r]-(connected)
		RETURN n, collect({relationship: r, node: connected}) as connections
		LIMIT 1
	`
	app.runGraphQuery(w, r, query, map[string]any{"nodeId": nodeID}, 10*time.Second, "")
}

// graphFileHierarchyHandler returns the file structure hierarchy
func (app *application) graphFileHierarchyHandler(w http.ResponseWriter, r *http.Request) {
	query := `
		MATCH (f:File)
		OPTIONAL MATCH (f)-[r:CONTAINS]->(content)
		WITH f, count(content) as itemCount, collect(labels(content)[0]) as contentTypes
		RETURN f.path as path, f.language as language, itemCount, contentTypes
		ORDER BY path
		LIMIT 100
	`
	app.runGraphQuery(w, r, query, map[string]any{}, 15*time.Second, "files")
}

// graphTopNodesHandler returns the most connected/important nodes
func (app *application) graphTopNodesHandler(w http.ResponseWriter, r *http.Request) {
	nodeType := r.URL.Query().Get("type") // File, Function, Class, etc.
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if l, err := fmt.Sscanf(limitStr, "%d", &limit); err == nil && l == 1 {
			// limit parsed successfully
		}
	}
	params := map[string]any{"limit": limit}
	var query string
	if nodeType != "" {
		query = `
			MATCH (n)
			WHERE $nodeType IN labels(n)
			OPTIONAL MATCH (n)-[r]-(connected)
			WITH n, count(r) as connections
			WHERE connections > 0
			RETURN n, connections
			ORDER BY connections DESC
			LIMIT $limit
		`
		params["nodeType"] = nodeType
	} else {
		query = `
			MATCH (n)-[r]-()
			WITH n, labels(n)[0] as type, count(r) as connections
			RETURN n, type, connections
			ORDER BY connections DESC
			LIMIT $limit
		`
	}
	app.runGraphQuery(w, r, query, params, 15*time.Second, "topNodes")
}

// --- HELPER METHODS ---

// writeJSON is a helper for sending JSON responses.
func (app *application) writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		app.logError(nil, err)
	}
}

// errorResponse is a helper for sending consistent error messages.
func (app *application) errorResponse(w http.ResponseWriter, r *http.Request, status int, message string) {
	errData := map[string]string{"error": message}
	app.writeJSON(w, status, errData)
}

// logError is a helper for logging errors.
func (app *application) logError(r *http.Request, err error) {
	app.logger.Println(err)
}

// unzip function to extract a zip archive.
func unzip(src, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()
	os.MkdirAll(dest, 0755)
	for _, f := range r.File {
		fpath := filepath.Join(dest, f.Name)
		if !strings.HasPrefix(fpath, filepath.Clean(dest)+string(os.PathSeparator)) {
			return fmt.Errorf("%s: illegal file path", fpath)
		}
		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
			continue
		}
		if err := os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
			return err
		}
		outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		_, err = io.Copy(outFile, rc)
		outFile.Close()
		rc.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

// extractRepoName extracts the repository name from a GitHub URL.
func extractRepoName(repoURL string) string {
	parts := strings.Split(strings.TrimSuffix(repoURL, ".git"), "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return repoURL
}

// --- GRAPH QUERY HELPER ---
// runGraphQuery is a modular helper for running graph queries with projectID and error handling
func (app *application) runGraphQuery(
	w http.ResponseWriter, r *http.Request,
	query string, params map[string]any, timeout time.Duration, wrapKey string,
) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Add projectID if present
	projectID := r.URL.Query().Get("projectId")
	if projectID != "" {
		params["projectId"] = projectID
	}

	results, err := app.db.Query(ctx, query, params)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "Failed to execute graph query: "+err.Error())
		return
	}
	if wrapKey != "" {
		app.writeJSON(w, http.StatusOK, map[string]any{wrapKey: results})
	} else {
		app.writeJSON(w, http.StatusOK, results)
	}
}

func (app *application) listProjectsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middlewares.UserIDKey).(string)
	if !ok || userID == "" {
		app.errorResponse(w, r, http.StatusUnauthorized, "User ID not found in context")
		return
	}
	projects, err := app.db.GetProjectsByUser(userID)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "Failed to fetch projects: "+err.Error())
		return
	}
	app.writeJSON(w, http.StatusOK, map[string]any{"projects": projects})
}
