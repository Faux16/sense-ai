package storage

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// Finding represents a detected Shadow AI instance
type Finding struct {
	ID        int       `json:"id"`
	Type      string    `json:"type"`
	Details   string    `json:"details"`
	Source    string    `json:"source"` // JSON blob with rich metadata
	Timestamp time.Time `json:"timestamp"`
	Severity  float64   `json:"severity"`
}

type Store struct {
	db *sql.DB
}

func NewStore(dbPath string) (*Store, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS findings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            details TEXT,
            source TEXT,
            timestamp TEXT,
            severity REAL
        );
    `)
	if err != nil {
		return nil, err
	}

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) LogFinding(f Finding) error {
	ts := f.Timestamp.Format(time.RFC3339)
	_, err := s.db.Exec(
		"INSERT INTO findings (type, details, source, timestamp, severity) VALUES (?, ?, ?, ?, ?)",
		f.Type, f.Details, f.Source, ts, f.Severity,
	)
	if err != nil {
		return fmt.Errorf("failed to log finding (type=%s, severity=%.2f): %w", f.Type, f.Severity, err)
	}
	return nil
}

func (s *Store) GetFindings() ([]Finding, error) {
	rows, err := s.db.Query("SELECT id, type, details, source, timestamp, severity FROM findings ORDER BY id DESC LIMIT 1000")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Finding
	for rows.Next() {
		var f Finding
		var ts string
		var source sql.NullString // Handle potential NULLs from old schema
		if err := rows.Scan(&f.ID, &f.Type, &f.Details, &source, &ts, &f.Severity); err != nil {
			continue
		}
		f.Source = source.String
		parsedTime, err := time.Parse(time.RFC3339, ts)
		if err != nil {
			fmt.Printf("[WARN] Failed to parse timestamp '%s' for finding ID %d: %v\n", ts, f.ID, err)
			f.Timestamp = time.Time{} // Zero value as fallback
		} else {
			f.Timestamp = parsedTime
		}
		list = append(list, f)
	}
	return list, nil
}
