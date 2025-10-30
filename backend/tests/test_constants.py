"""
Unit tests for constants module
Validates configuration consistency and correctness
"""

import pytest
from app.constants import (
    # Languages
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
    
    # Statuses
    ALL_STATUSES,
    ERROR_STATUSES,
    SUCCESS_STATUSES,
    STATUS_PENDING,
    STATUS_ACCEPTED,
    
    # Difficulties
    ALL_DIFFICULTIES,
    DIFFICULTY_EASY,
    DIFFICULTY_MEDIUM,
    DIFFICULTY_HARD,
    
    # Limits
    DEFAULT_TIME_LIMIT_MS,
    DEFAULT_MEMORY_LIMIT_KB,
    MIN_TIME_LIMIT_MS,
    MAX_TIME_LIMIT_MS,
    MIN_MEMORY_LIMIT_KB,
    MAX_MEMORY_LIMIT_KB,
    
    # Test cases
    DEFAULT_TEST_CASE_POINTS,
    MIN_TEST_CASE_POINTS,
    MAX_TEST_CASE_POINTS,
)


class TestLanguageConstants:
    """Test language-related constants"""
    
    def test_supported_languages_not_empty(self):
        """Supported languages list should not be empty"""
        assert len(SUPPORTED_LANGUAGES) > 0, "No languages supported"
    
    def test_supported_languages_lowercase(self):
        """Language identifiers should be lowercase"""
        for lang in SUPPORTED_LANGUAGES:
            assert lang.islower(), f"Language '{lang}' should be lowercase"
    
    def test_supported_languages_no_duplicates(self):
        """No duplicate languages"""
        assert len(SUPPORTED_LANGUAGES) == len(set(SUPPORTED_LANGUAGES)), \
            "Duplicate languages found"
    
    def test_default_language_in_supported(self):
        """Default language must be in supported list"""
        assert DEFAULT_LANGUAGE in SUPPORTED_LANGUAGES, \
            f"Default language '{DEFAULT_LANGUAGE}' not in supported list"
    
    def test_known_languages_present(self):
        """Essential languages should be present"""
        essential_langs = ['cpp', 'python', 'java']
        for lang in essential_langs:
            assert lang in SUPPORTED_LANGUAGES, \
                f"Essential language '{lang}' missing"


class TestStatusConstants:
    """Test status-related constants"""
    
    def test_all_statuses_not_empty(self):
        """Status list should not be empty"""
        assert len(ALL_STATUSES) > 0
    
    def test_all_statuses_unique(self):
        """No duplicate statuses"""
        assert len(ALL_STATUSES) == len(set(ALL_STATUSES)), \
            "Duplicate statuses found"
    
    def test_pending_in_all_statuses(self):
        """Pending status must be in all statuses"""
        assert STATUS_PENDING in ALL_STATUSES
    
    def test_accepted_in_all_statuses(self):
        """Accepted status must be in all statuses"""
        assert STATUS_ACCEPTED in ALL_STATUSES
    
    def test_error_statuses_subset_of_all(self):
        """Error statuses must be subset of all statuses"""
        for status in ERROR_STATUSES:
            assert status in ALL_STATUSES, \
                f"Error status '{status}' not in ALL_STATUSES"
    
    def test_success_statuses_subset_of_all(self):
        """Success statuses must be subset of all statuses"""
        for status in SUCCESS_STATUSES:
            assert status in ALL_STATUSES, \
                f"Success status '{status}' not in ALL_STATUSES"
    
    def test_error_and_success_disjoint(self):
        """Error and success statuses should not overlap"""
        overlap = set(ERROR_STATUSES) & set(SUCCESS_STATUSES)
        assert len(overlap) == 0, \
            f"Statuses in both error and success: {overlap}"
    
    def test_pending_not_in_error_or_success(self):
        """Pending should not be in error or success"""
        assert STATUS_PENDING not in ERROR_STATUSES
        assert STATUS_PENDING not in SUCCESS_STATUSES


class TestDifficultyConstants:
    """Test difficulty-related constants"""
    
    def test_all_difficulties_not_empty(self):
        """Difficulty list should not be empty"""
        assert len(ALL_DIFFICULTIES) > 0
    
    def test_all_difficulties_unique(self):
        """No duplicate difficulties"""
        assert len(ALL_DIFFICULTIES) == len(set(ALL_DIFFICULTIES))
    
    def test_standard_difficulties_present(self):
        """Standard difficulty levels must be present"""
        assert DIFFICULTY_EASY in ALL_DIFFICULTIES
        assert DIFFICULTY_MEDIUM in ALL_DIFFICULTIES
        assert DIFFICULTY_HARD in ALL_DIFFICULTIES
    
    def test_difficulties_lowercase(self):
        """Difficulty levels should be lowercase"""
        for diff in ALL_DIFFICULTIES:
            assert diff.islower(), f"Difficulty '{diff}' should be lowercase"


class TestLimitConstants:
    """Test resource limit constants"""
    
    def test_time_limits_positive(self):
        """Time limits must be positive"""
        assert DEFAULT_TIME_LIMIT_MS > 0
        assert MIN_TIME_LIMIT_MS > 0
        assert MAX_TIME_LIMIT_MS > 0
    
    def test_time_limits_ordered(self):
        """Time limits must be in correct order"""
        assert MIN_TIME_LIMIT_MS <= DEFAULT_TIME_LIMIT_MS <= MAX_TIME_LIMIT_MS, \
            "Time limits not properly ordered"
    
    def test_time_limits_reasonable(self):
        """Time limits should be reasonable"""
        assert MIN_TIME_LIMIT_MS >= 10, "Min time too low"
        assert MAX_TIME_LIMIT_MS <= 60000, "Max time too high (>60s)"
    
    def test_memory_limits_positive(self):
        """Memory limits must be positive"""
        assert DEFAULT_MEMORY_LIMIT_KB > 0
        assert MIN_MEMORY_LIMIT_KB > 0
        assert MAX_MEMORY_LIMIT_KB > 0
    
    def test_memory_limits_ordered(self):
        """Memory limits must be in correct order"""
        assert MIN_MEMORY_LIMIT_KB <= DEFAULT_MEMORY_LIMIT_KB <= MAX_MEMORY_LIMIT_KB, \
            "Memory limits not properly ordered"
    
    def test_memory_limits_reasonable(self):
        """Memory limits should be reasonable"""
        assert MIN_MEMORY_LIMIT_KB >= 1024, "Min memory too low (<1MB)"
        assert MAX_MEMORY_LIMIT_KB <= 2048576, "Max memory too high (>2GB)"
    
    def test_default_memory_adequate(self):
        """Default memory should be adequate for most programs"""
        assert DEFAULT_MEMORY_LIMIT_KB >= 65536, \
            "Default memory too low (<64MB)"


class TestTestCaseConstants:
    """Test test case point constants"""
    
    def test_points_non_negative(self):
        """Points must be non-negative"""
        assert DEFAULT_TEST_CASE_POINTS >= 0
        assert MIN_TEST_CASE_POINTS >= 0
        assert MAX_TEST_CASE_POINTS >= 0
    
    def test_points_ordered(self):
        """Points must be in correct order"""
        assert MIN_TEST_CASE_POINTS <= DEFAULT_TEST_CASE_POINTS <= MAX_TEST_CASE_POINTS
    
    def test_points_reasonable(self):
        """Points should be reasonable"""
        assert MAX_TEST_CASE_POINTS <= 1000, "Max points too high"
        assert DEFAULT_TEST_CASE_POINTS <= MAX_TEST_CASE_POINTS


class TestConstantsConsistency:
    """Test overall consistency across constants"""
    
    def test_no_empty_strings(self):
        """Constants should not be empty strings"""
        constants_to_check = [
            DEFAULT_LANGUAGE,
            STATUS_PENDING,
            STATUS_ACCEPTED,
            DIFFICULTY_EASY,
            DIFFICULTY_MEDIUM,
            DIFFICULTY_HARD,
        ]
        for const in constants_to_check:
            assert const != "", f"Empty string constant found"
            assert len(const) > 0
    
    def test_status_naming_convention(self):
        """Status constants should follow naming convention"""
        # All statuses should be title case with spaces (for display)
        for status in ALL_STATUSES:
            # Should not be all uppercase
            assert status != status.upper() or ' ' in status, \
                f"Status '{status}' doesn't follow naming convention"
    
    def test_language_naming_convention(self):
        """Language constants should be simple identifiers"""
        # Languages should be simple lowercase strings, no spaces
        for lang in SUPPORTED_LANGUAGES:
            assert ' ' not in lang, f"Language '{lang}' contains space"
            assert lang.replace('-', '').replace('_', '').isalnum(), \
                f"Language '{lang}' contains invalid characters"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
