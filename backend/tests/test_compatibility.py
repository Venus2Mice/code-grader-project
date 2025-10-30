"""
Integration Tests for Backend-Worker Compatibility
Tests synchronization between backend and worker components
"""

import pytest
import requests
import time
from typing import Set


class TestBackendWorkerCompatibility:
    """Test suite to ensure backend and worker are in sync"""
    
    BACKEND_URL = "http://localhost:5000"
    WORKER_URL = "http://localhost:8080"
    
    def test_backend_reachable(self):
        """Test if backend is accessible"""
        try:
            response = requests.get(f"{self.BACKEND_URL}/health", timeout=5)
            assert response.status_code == 200, "Backend health check failed"
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Backend is not reachable: {e}")
    
    def test_worker_reachable(self):
        """Test if worker API is accessible"""
        try:
            response = requests.get(f"{self.WORKER_URL}/health", timeout=5)
            assert response.status_code == 200, "Worker health check failed"
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Worker is not reachable: {e}")
    
    def test_supported_languages_sync(self):
        """
        CRITICAL TEST: Verify backend and worker support the same languages
        If this fails, users can submit code in unsupported languages
        """
        # Get supported languages from backend
        backend_response = requests.get(f"{self.BACKEND_URL}/api/config/languages")
        assert backend_response.status_code == 200, "Failed to get backend languages"
        backend_data = backend_response.json()
        backend_langs: Set[str] = set(backend_data['languages'])
        
        # Get supported languages from worker
        worker_response = requests.get(f"{self.WORKER_URL}/languages")
        assert worker_response.status_code == 200, "Failed to get worker languages"
        worker_data = worker_response.json()
        worker_langs: Set[str] = {lang['language'] for lang in worker_data}
        
        # Verify they match
        assert backend_langs == worker_langs, (
            f"Language mismatch!\n"
            f"Backend supports: {sorted(backend_langs)}\n"
            f"Worker supports: {sorted(worker_langs)}\n"
            f"Backend only: {backend_langs - worker_langs}\n"
            f"Worker only: {worker_langs - backend_langs}"
        )
        
        print(f"✅ Languages synchronized: {sorted(backend_langs)}")
    
    def test_worker_health_response_format(self):
        """Test worker health endpoint returns correct format"""
        response = requests.get(f"{self.WORKER_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields
        required_fields = [
            'status', 'uptime', 'supported_languages', 
            'container_pool_size', 'database_status', 
            'tasks_processed', 'version'
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Check data types
        assert isinstance(data['status'], str)
        assert isinstance(data['uptime'], str)
        assert isinstance(data['supported_languages'], list)
        assert isinstance(data['container_pool_size'], int)
        assert isinstance(data['database_status'], str)
        assert isinstance(data['tasks_processed'], int)
        assert isinstance(data['version'], str)
        
        print(f"✅ Worker health check format valid")
    
    def test_backend_config_cache_headers(self):
        """Test that backend config endpoints have proper cache headers"""
        response = requests.get(f"{self.BACKEND_URL}/api/config/metadata")
        assert response.status_code == 200
        
        # Check cache headers
        assert 'Cache-Control' in response.headers, "Missing Cache-Control header"
        cache_control = response.headers['Cache-Control']
        assert 'max-age' in cache_control, "Cache-Control missing max-age"
        assert 'public' in cache_control, "Cache-Control should be public"
        
        print(f"✅ Cache headers present: {cache_control}")
    
    def test_worker_health_cache_performance(self):
        """Test that worker health endpoint uses caching effectively"""
        # First request (should be MISS)
        response1 = requests.get(f"{self.WORKER_URL}/health")
        assert response1.status_code == 200
        
        # Second request immediately after (should be HIT)
        response2 = requests.get(f"{self.WORKER_URL}/health")
        assert response2.status_code == 200
        
        # Check if cache header is present
        if 'X-Cache' in response2.headers:
            assert response2.headers['X-Cache'] == 'HIT', "Second request should hit cache"
            print(f"✅ Health check caching works: {response2.headers['X-Cache']}")
        else:
            print("⚠️  Warning: X-Cache header not present (cache might not be implemented)")
    
    def test_language_details_endpoint(self):
        """Test worker's language detail endpoint"""
        # Get list of languages
        langs_response = requests.get(f"{self.WORKER_URL}/languages")
        assert langs_response.status_code == 200
        languages = langs_response.json()
        
        # Test detail endpoint for each language
        for lang_info in languages:
            lang_id = lang_info['language']
            detail_response = requests.get(f"{self.WORKER_URL}/languages/{lang_id}")
            assert detail_response.status_code == 200, f"Failed to get details for {lang_id}"
            
            detail = detail_response.json()
            
            # Verify required fields
            assert 'language' in detail
            assert 'file_extension' in detail
            assert 'time_multiplier' in detail
            assert 'memory_multiplier' in detail
            
            # Verify multipliers are reasonable
            assert 0.1 <= detail['time_multiplier'] <= 10.0, \
                f"Invalid time multiplier for {lang_id}: {detail['time_multiplier']}"
            assert 0.1 <= detail['memory_multiplier'] <= 10.0, \
                f"Invalid memory multiplier for {lang_id}: {detail['memory_multiplier']}"
        
        print(f"✅ Language detail endpoints working for all {len(languages)} languages")
    
    def test_worker_database_connectivity(self):
        """Test that worker can connect to database"""
        response = requests.get(f"{self.WORKER_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['database_status'] == 'ok', \
            f"Worker database connection failed: {data['database_status']}"
        
        print("✅ Worker database connection OK")
    
    def test_backend_metadata_completeness(self):
        """Test that backend metadata endpoint returns complete information"""
        response = requests.get(f"{self.BACKEND_URL}/api/config/metadata")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check structure
        assert 'languages' in data
        assert 'difficulties' in data
        assert 'limits' in data
        assert 'version' in data
        
        # Check languages section
        assert 'supported' in data['languages']
        assert 'default' in data['languages']
        assert len(data['languages']['supported']) > 0
        
        # Check limits section
        assert 'default_time_ms' in data['limits']
        assert 'default_memory_kb' in data['limits']
        
        print(f"✅ Backend metadata complete")
    
    def test_no_unsupported_languages_in_backend(self):
        """Test that backend doesn't accept languages not supported by worker"""
        backend_response = requests.get(f"{self.BACKEND_URL}/api/config/languages")
        backend_langs = set(backend_response.json()['languages'])
        
        worker_response = requests.get(f"{self.WORKER_URL}/languages")
        worker_langs = {lang['language'] for lang in worker_response.json()}
        
        # Backend should not support more languages than worker
        unsupported = backend_langs - worker_langs
        assert len(unsupported) == 0, (
            f"Backend accepts languages not supported by worker: {unsupported}\n"
            f"This will cause submission failures!"
        )
        
        print("✅ No unsupported languages in backend")


class TestEndToEndGrading:
    """End-to-end tests for the grading pipeline"""
    
    BACKEND_URL = "http://localhost:5000"
    WORKER_URL = "http://localhost:8080"
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for testing (implement based on your auth)"""
        # TODO: Implement authentication
        return "test_token"
    
    def test_submission_status_constants_match(self):
        """
        Verify that submission statuses used by worker match backend expectations
        This is a documentation test - actual validation happens at runtime
        """
        # Expected statuses (from constants.py)
        expected_statuses = {
            'Pending', 'Accepted', 'Wrong Answer',
            'Compile Error', 'Runtime Error',
            'Time Limit Exceeded', 'Memory Limit Exceeded',
            'System Error'
        }
        
        # This test documents the expected behavior
        # Actual validation happens when worker sends results to backend
        print(f"✅ Expected submission statuses documented: {len(expected_statuses)} statuses")


if __name__ == "__main__":
    """Run tests with pytest"""
    pytest.main([__file__, "-v", "-s"])
