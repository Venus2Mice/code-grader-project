package language

import (
	"fmt"
	"sync"
)

// Registry manages all available language handlers
// Singleton pattern for global access
var (
	registry     *HandlerRegistry
	registryOnce sync.Once
)

// HandlerRegistry stores and retrieves language handlers
type HandlerRegistry struct {
	handlers map[string]LanguageHandler
	mu       sync.RWMutex
}

// GetRegistry returns the singleton registry instance
func GetRegistry() *HandlerRegistry {
	registryOnce.Do(func() {
		registry = &HandlerRegistry{
			handlers: make(map[string]LanguageHandler),
		}
		// Register default handlers
		registry.registerDefaultHandlers()
	})
	return registry
}

// Register adds a language handler to the registry
func (r *HandlerRegistry) Register(handler LanguageHandler) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.handlers[handler.GetLanguage()] = handler
}

// Get retrieves a language handler by language identifier
func (r *HandlerRegistry) Get(language string) (LanguageHandler, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	handler, exists := r.handlers[language]
	if !exists {
		return nil, fmt.Errorf("unsupported language: %s", language)
	}
	return handler, nil
}

// GetAll returns all registered handlers
func (r *HandlerRegistry) GetAll() map[string]LanguageHandler {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Return a copy to prevent external modification
	result := make(map[string]LanguageHandler, len(r.handlers))
	for k, v := range r.handlers {
		result[k] = v
	}
	return result
}

// IsSupported checks if a language is supported
func (r *HandlerRegistry) IsSupported(language string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.handlers[language]
	return exists
}

// GetSupportedLanguages returns a list of all supported language identifiers
func (r *HandlerRegistry) GetSupportedLanguages() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	languages := make([]string, 0, len(r.handlers))
	for lang := range r.handlers {
		languages = append(languages, lang)
	}
	return languages
}

// registerDefaultHandlers registers the built-in language handlers
func (r *HandlerRegistry) registerDefaultHandlers() {
	// Register C++
	r.Register(NewCppHandler())

	// Register Python
	r.Register(NewPythonHandler())

	// Register Java
	r.Register(NewJavaHandler())

	// TODO: Add more languages
	// r.Register(NewNodeHandler())
	// r.Register(NewGoHandler())
	// r.Register(NewRustHandler())
}
