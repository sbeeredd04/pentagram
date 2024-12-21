from models import db

def initialize_db(app):
    with app.app_context():
        db.create_all()
        print("Database initialized!")
