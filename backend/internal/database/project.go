package database

import (
	"github.com/google/uuid"
	"time"
)

func (db *DB) CreateProject(userID, name, s3Key string) (string, error) {
	projectID := uuid.New().String()
	_, err := db.SQL.Exec(
		"INSERT INTO projects (id, user_id, name, s3_key, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
		projectID, userID, name, s3Key, "pending", time.Now(),
	)
	return projectID, err
}

func (db *DB) UpdateProjectStatus(projectID, status string) error {
	_, err := db.SQL.Exec("UPDATE projects SET status = $1 WHERE id = $2", status, projectID)
	return err
}// ...existing code...

type Project struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    Name      string    `json:"name"`
    S3Key     string    `json:"s3_key"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
}

func (db *DB) GetProjectsByUser(userID string) ([]Project, error) {
    rows, err := db.SQL.Query("SELECT id, user_id, name, s3_key, status, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC", userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var projects []Project
    for rows.Next() {
        var p Project
        if err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.S3Key, &p.Status, &p.CreatedAt); err != nil {
            return nil, err
        }
        projects = append(projects, p)
    }
    return projects, nil
}
// ...existing code...