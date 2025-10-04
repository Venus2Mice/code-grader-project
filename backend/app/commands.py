import click
from flask.cli import with_appcontext
from .models import Role, db


@click.command(name='seed_db')
@with_appcontext
def seed_db_command():
    """Creates the initial roles in the database."""
    # Check if role exists
    if Role.query.filter_by(name='teacher').first() is None:
        teacher_role = Role(name='teacher')
        db.session.add(teacher_role)
        db.session.commit()
        print('Created teacher role')

    if Role.query.filter_by(name='student').first() is None:
        student_role = Role(name='student')
        db.session.add(student_role)
        db.session.commit()
        print('Created student role')

    print('Seeded database')


def init_app(app):
    app.cli.add_command(seed_db_command)