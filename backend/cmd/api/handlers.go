package main

import (
	"encoding/json"	
	"net/http"
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


// writeJSON is a helper for sending JSON responses.
func (app *application) writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		app.logError(nil, err)
	}
}

// logError is a helper for logging errors.
func (app *application) logError(r *http.Request, err error) {
	app.logger.Println(err)
}
