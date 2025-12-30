package database

import (
	"github.com/1107-adishjain/codemap/internal/helper"
	"github.com/1107-adishjain/codemap/internal/models"
	"context"
	"fmt"
	"regexp"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

// Query executes a read-only Cypher query and returns the results as a slice of maps, filtered by projectID if provided.
func (db *DB) Query(ctx context.Context, cypher string, params map[string]any) ([]map[string]any, error) {
	session := db.Driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	// If projectID is present in params, inject project filtering into the Cypher query
	if projectID, ok := params["projectId"]; ok && projectID != nil && projectID != "" {
		cypher = wrapCypherWithProjectFilter(cypher)
	}

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		res, err := tx.Run(ctx, cypher, params)
		if err != nil {
			return nil, err
		}

		records, err := res.Collect(ctx)
		if err != nil {
			return nil, err
		}

		var results []map[string]any
		for _, record := range records {
			results = append(results, record.AsMap())
		}

		return results, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed during query execution: %w", err)
	}

	return result.([]map[string]any), nil
}

// wrapCypherWithProjectFilter injects project filtering into the Cypher query for modularity.
func wrapCypherWithProjectFilter(cypher string) string {
	// First, handle the original MATCH (n) and MATCH (n: cases for backward compatibility
	if idx := findMatchClauseIndex(cypher, "MATCH (n)"); idx != -1 {
		return cypher[:idx] + "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(n)" + cypher[idx+len("MATCH (n)"):]
	}
	if idx := findMatchClauseIndex(cypher, "MATCH (n:"); idx != -1 {
		return cypher[:idx] + "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(n:" + cypher[idx+len("MATCH (n:"):]
	}

	// Now, handle any MATCH (x:Label) pattern (excluding n)
	re := regexp.MustCompile(`MATCH \((\w+):(\w+)\)`)
	loc := re.FindStringSubmatchIndex(cypher)
	if loc != nil {
		varName := cypher[loc[2]:loc[3]]
		label := cypher[loc[4]:loc[5]]
		// Don't replace if varName is 'n' (already handled above)
		if varName != "n" {
			replacement := "MATCH (p:Project {id: $projectId})<-[:BELONGS_TO]-(" + varName + ":" + label + ")"
			return cypher[:loc[0]] + replacement + cypher[loc[1]:]
		}
	}
	// If not found, return as is
	return cypher
}

// findMatchClauseIndex returns the index of the first occurrence of the clause, or -1 if not found.
func findMatchClauseIndex(s, clause string) int {
	for i := 0; i+len(clause) <= len(s); i++ {
		if s[i:i+len(clause)] == clause {
			return i
		}
	}
	return -1
}

// ImportAnalysis imports the entire analysis result into Neo4j within a single transaction.
func (db *DB) ImportAnalysis(ctx context.Context, analysisData *models.Analysis, projectID, projectName string) error {
	session := db.Driver.NewSession(ctx, neo4j.SessionConfig{DatabaseName: "neo4j"})
	defer session.Close(ctx)

	fmt.Printf("🔍 IMPORTING ANALYSIS: %d files found\n", len(analysisData.Files))
	for i, file := range analysisData.Files {
		fmt.Printf("  File %d: %s (%s) - %d classes, %d functions\n",
			i+1, file.Path, file.Language, len(file.Classes), len(file.Functions))
		if file.Error != "" {
			fmt.Printf("    ERROR: %s\n", file.Error)
		}
	}

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		// Create Project node
		_, err := tx.Run(ctx,
			"MERGE (p:Project {id: $id, name: $name, created_at: datetime()})",
			map[string]any{"id": projectID, "name": projectName},
		)
		if err != nil {
			return nil, err
		}

		// Create all nodes and link to Project
		for _, file := range analysisData.Files {
			if err := helper.CreateNodesForFile(ctx, tx, file); err != nil {
				return nil, fmt.Errorf("failed to create nodes for file %s: %w", file.Path, err)
			}
			// Link File node to Project
			_, err := tx.Run(ctx,
				"MATCH (f:File {path: $path}), (p:Project {id: $id}) MERGE (f)-[:BELONGS_TO]->(p)",
				map[string]any{"path": file.Path, "id": projectID},
			)
			if err != nil {
				return nil, err
			}
			// Link Class nodes to Project
			for _, class := range file.Classes {
				classId := fmt.Sprintf("%s#%s", file.Path, class.Name)
				_, err := tx.Run(ctx,
					"MATCH (c:Class {id: $classId}), (p:Project {id: $id}) MERGE (c)-[:BELONGS_TO]->(p)",
					map[string]any{"classId": classId, "id": projectID},
				)
				if err != nil {
					return nil, err
				}
			}
			// Link Function nodes to Project
			for _, function := range file.Functions {
				funcId := fmt.Sprintf("%s#%s", file.Path, function.Name)
				_, err := tx.Run(ctx,
					"MATCH (fn:Function {id: $funcId}), (p:Project {id: $id}) MERGE (fn)-[:BELONGS_TO]->(p)",
					map[string]any{"funcId": funcId, "id": projectID},
				)
				if err != nil {
					return nil, err
				}
			}
		}

		// Create all relationships
		for _, file := range analysisData.Files {
			if err := helper.CreateRelationshipsForFile(ctx, tx, file); err != nil {
				return nil, fmt.Errorf("failed to create relationships for file %s: %w", file.Path, err)
			}
		}
		return nil, nil
	})

	if err != nil {
		return fmt.Errorf("failed to execute import transaction: %w", err)
	}

	fmt.Println("Successfully imported analysis into Neo4j and linked to project.")
	return nil
}
