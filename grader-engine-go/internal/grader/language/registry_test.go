package language

import (
	"sync"
	"testing"
)

func TestRegistry_Singleton(t *testing.T) {
	registry1 := GetRegistry()
	registry2 := GetRegistry()
	
	if registry1 != registry2 {
		t.Error("GetRegistry() should return the same instance (singleton)")
	}
}

func TestRegistry_GetSupportedLanguages(t *testing.T) {
	registry := GetRegistry()
	languages := registry.GetSupportedLanguages()
	
	expectedLanguages := map[string]bool{
		"cpp":    true,
		"python": true,
		"java":   true,
	}
	
	if len(languages) != len(expectedLanguages) {
		t.Errorf("Expected %d languages, got %d", len(expectedLanguages), len(languages))
	}
	
	for _, lang := range languages {
		if !expectedLanguages[lang] {
			t.Errorf("Unexpected language: %s", lang)
		}
	}
}

func TestRegistry_Get(t *testing.T) {
	registry := GetRegistry()
	
	tests := []struct {
		name     string
		language string
		wantErr  bool
	}{
		{
			name:     "Get C++ handler",
			language: "cpp",
			wantErr:  false,
		},
		{
			name:     "Get Python handler",
			language: "python",
			wantErr:  false,
		},
		{
			name:     "Get Java handler",
			language: "java",
			wantErr:  false,
		},
		{
			name:     "Get unsupported language",
			language: "rust",
			wantErr:  true,
		},
		{
			name:     "Get empty language",
			language: "",
			wantErr:  true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, err := registry.Get(tt.language)
			
			if tt.wantErr {
				if err == nil {
					t.Error("Expected error, got nil")
				}
				if handler != nil {
					t.Error("Expected nil handler on error")
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got: %v", err)
				}
				if handler == nil {
					t.Error("Expected handler, got nil")
				}
				if handler.GetLanguage() != tt.language {
					t.Errorf("Expected language %s, got %s", tt.language, handler.GetLanguage())
				}
			}
		})
	}
}

func TestRegistry_Register(t *testing.T) {
	// Create a new registry for testing (not the global one)
	registry := &HandlerRegistry{
		handlers: make(map[string]LanguageHandler),
	}
	
	// Register a handler
	handler := &CppHandler{}
	registry.Register(handler)
	
	// Verify registration
	retrieved, err := registry.Get("cpp")
	if err != nil {
		t.Errorf("Failed to get registered handler: %v", err)
	}
	if retrieved != handler {
		t.Error("Retrieved handler is not the same as registered")
	}
}

func TestRegistry_ThreadSafety(t *testing.T) {
	registry := GetRegistry()
	
	// Test concurrent reads
	var wg sync.WaitGroup
	numGoroutines := 100
	
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			
			lang := "cpp"
			if id%3 == 1 {
				lang = "python"
			} else if id%3 == 2 {
				lang = "java"
			}
			
			handler, err := registry.Get(lang)
			if err != nil {
				t.Errorf("Error getting handler: %v", err)
				return
			}
			if handler == nil {
				t.Error("Got nil handler")
				return
			}
			if handler.GetLanguage() != lang {
				t.Errorf("Expected language %s, got %s", lang, handler.GetLanguage())
			}
		}(i)
	}
	
	wg.Wait()
}

func TestRegistry_RegisterDuplicate(t *testing.T) {
	// Create a new registry for testing
	registry := &HandlerRegistry{
		handlers: make(map[string]LanguageHandler),
	}
	
	// Register first handler
	handler1 := &CppHandler{}
	registry.Register(handler1)
	
	// Register duplicate (should replace)
	handler2 := &CppHandler{}
	registry.Register(handler2)
	
	// Verify the second handler replaced the first
	retrieved, err := registry.Get("cpp")
	if err != nil {
		t.Errorf("Failed to get handler: %v", err)
	}
	if retrieved != handler2 {
		t.Error("Duplicate registration did not replace the handler")
	}
}
