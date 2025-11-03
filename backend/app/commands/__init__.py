"""Flask CLI commands package."""

from .seed_db import seed_db_command
from .seed_test_data import seed_test_data_command
from .seed_submissions import seed_test_submissions_command
from .cleanup import cleanup_test_submissions_command
from .generate_tokens import generate_tokens_command


def init_app(app):
    """Register all CLI commands with the Flask app."""
    app.cli.add_command(seed_db_command)
    app.cli.add_command(seed_test_data_command)
    app.cli.add_command(seed_test_submissions_command)
    app.cli.add_command(cleanup_test_submissions_command)
    app.cli.add_command(generate_tokens_command)
