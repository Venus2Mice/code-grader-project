"""Cleanup old test submissions."""

import click
from flask.cli import with_appcontext


@click.command(name='cleanup_test_submissions')
@with_appcontext
def cleanup_test_submissions_command():
    """Xóa các test submissions cũ (is_test=True)."""
    from ..cleanup_service import cleanup_old_test_submissions
    
    count = cleanup_old_test_submissions(hours=1)
    print(f"✅ Cleaned up {count} old test submissions")
