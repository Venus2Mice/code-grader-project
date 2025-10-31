"""Seed database with initial roles."""

import click
from flask.cli import with_appcontext
from ..models import Role, db


@click.command(name='seed_db')
@with_appcontext
def seed_db_command():
    """Tạo các vai trò ban đầu trong CSDL."""
    if Role.query.filter_by(name='teacher').first() is None:
        teacher_role = Role(name='teacher')
        db.session.add(teacher_role)
        print("Đã thêm vai trò 'teacher'.")

    if Role.query.filter_by(name='student').first() is None:
        student_role = Role(name='student')
        db.session.add(student_role)
        print("Đã thêm vai trò 'student'.")

    db.session.commit()
    print("CSDL đã được seed với các vai trò cơ bản!")
