from flask import Flask
from models import db
from db import initialize_db
from flask_cors import CORS
from endpoints import register_routes

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)

# Initialize database
db.init_app(app)
initialize_db(app)

register_routes(app)

@app.route('/')
def home():
    return "Welcome to the Flask Image Sharing App!"

if __name__ == '__main__':
    app.run(debug=True, port=5001)
