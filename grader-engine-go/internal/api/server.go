package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"grader-engine-go/internal/grader/language"
	"grader-engine-go/internal/pool"

	"gorm.io/gorm"
)

// Server provides HTTP API endpoints for health checks and metadata
type Server struct {
	db              *gorm.DB
	pool            *pool.ContainerPool
	port            string
	startTime       time.Time
	tasksProcessed  uint64
	cachedHealth    *HealthResponse
	lastHealthCheck time.Time
	healthCacheTTL  time.Duration
	mu              sync.RWMutex
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status             string   `json:"status"`
	Uptime             string   `json:"uptime"`
	SupportedLanguages []string `json:"supported_languages"`
	ContainerPoolSize  int      `json:"container_pool_size"`
	DatabaseStatus     string   `json:"database_status"`
	TasksProcessed     uint64   `json:"tasks_processed"`
	Version            string   `json:"version"`
}

// LanguageInfoResponse provides detailed language information
type LanguageInfoResponse struct {
	Language         string  `json:"language"`
	FileExtension    string  `json:"file_extension"`
	SupportsStdio    bool    `json:"supports_stdio"`
	SupportsFunction bool    `json:"supports_function"`
	TimeMultiplier   float64 `json:"time_multiplier"`
	MemoryMultiplier float64 `json:"memory_multiplier"`
	MemoryOverheadKB int     `json:"memory_overhead_kb"`
}

// NewServer creates a new API server
func NewServer(db *gorm.DB, containerPool *pool.ContainerPool, port string) *Server {
	return &Server{
		db:             db,
		pool:           containerPool,
		port:           port,
		startTime:      time.Now(),
		healthCacheTTL: 5 * time.Second, // Cache health check for 5 seconds
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// Register routes
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/languages", s.handleLanguages)
	mux.HandleFunc("/languages/", s.handleLanguageDetail)

	log.Printf("🌐 Starting HTTP API server on port %s", s.port)
	return http.ListenAndServe(":"+s.port, mux)
}

// IncrementTaskCounter increments the task counter
func (s *Server) IncrementTaskCounter() {
	atomic.AddUint64(&s.tasksProcessed, 1)
}

// handleHealth returns the health status of the worker
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if we have a cached response that's still valid
	s.mu.RLock()
	if s.cachedHealth != nil && time.Since(s.lastHealthCheck) < s.healthCacheTTL {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(s.cachedHealth)
		s.mu.RUnlock()
		return
	}
	s.mu.RUnlock()

	// Perform actual health check
	s.mu.Lock()
	defer s.mu.Unlock()

	// Double-check after acquiring write lock (another goroutine might have updated it)
	if s.cachedHealth != nil && time.Since(s.lastHealthCheck) < s.healthCacheTTL {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Cache", "HIT")
		json.NewEncoder(w).Encode(s.cachedHealth)
		return
	}

	// Check database connection
	dbStatus := "ok"
	sqlDB, err := s.db.DB()
	if err != nil || sqlDB.Ping() != nil {
		dbStatus = "error"
	}

	// Get supported languages
	registry := language.GetRegistry()
	languages := registry.GetSupportedLanguages()

	uptime := time.Since(s.startTime)

	// Get pool size
	poolSize := 0
	if s.pool != nil {
		poolSize = s.pool.GetSize()
	}

	response := HealthResponse{
		Status:             "ok",
		Uptime:             uptime.String(),
		SupportedLanguages: languages,
		ContainerPoolSize:  poolSize,
		DatabaseStatus:     dbStatus,
		TasksProcessed:     atomic.LoadUint64(&s.tasksProcessed),
		Version:            "1.0.0",
	}

	// Cache the response
	s.cachedHealth = &response
	s.lastHealthCheck = time.Now()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	json.NewEncoder(w).Encode(response)
}

// handleLanguages returns the list of supported languages with details
func (s *Server) handleLanguages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	registry := language.GetRegistry()
	handlers := registry.GetAll()

	var languages []LanguageInfoResponse

	for _, handler := range handlers {
		multipliers := handler.GetResourceMultipliers()
		languages = append(languages, LanguageInfoResponse{
			Language:         handler.GetLanguage(),
			FileExtension:    handler.GetFileExtension(),
			SupportsStdio:    handler.SupportsStdio(),
			SupportsFunction: handler.SupportsFunction(),
			TimeMultiplier:   multipliers.TimeMultiplier,
			MemoryMultiplier: multipliers.MemoryMultiplier,
			MemoryOverheadKB: multipliers.MemoryOverhead,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(languages)
}

// handleLanguageDetail returns detailed info about a specific language
func (s *Server) handleLanguageDetail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract language from path: /languages/{lang}
	lang := r.URL.Path[len("/languages/"):]
	if lang == "" {
		http.Error(w, "Language not specified", http.StatusBadRequest)
		return
	}

	registry := language.GetRegistry()
	handler, err := registry.Get(lang)
	if err != nil {
		http.Error(w, "Language not supported", http.StatusNotFound)
		return
	}

	multipliers := handler.GetResourceMultipliers()
	response := LanguageInfoResponse{
		Language:         handler.GetLanguage(),
		FileExtension:    handler.GetFileExtension(),
		SupportsStdio:    handler.SupportsStdio(),
		SupportsFunction: handler.SupportsFunction(),
		TimeMultiplier:   multipliers.TimeMultiplier,
		MemoryMultiplier: multipliers.MemoryMultiplier,
		MemoryOverheadKB: multipliers.MemoryOverhead,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
