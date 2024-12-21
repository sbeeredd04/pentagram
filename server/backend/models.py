from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# Association table for the many-to-many relationship between User and Image
likes_table = db.Table('likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('image_id', db.Integer, db.ForeignKey('image.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    images = db.relationship('Image', backref='user', lazy=True)
    liked_images = db.relationship('Image', secondary=likes_table, backref='liked_by')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(200), unique=True, nullable=True)
    data = db.Column(db.LargeBinary, nullable=False)
    likes = db.Column(db.Integer, default=0)
    comments = db.Column(db.Text)
    username = db.Column(db.String(80), db.ForeignKey('user.username'), nullable=False)
    prompt = db.Column(db.String(500), nullable=True)
    isPublic = db.Column(db.Boolean, default=True)
    tags = db.Column(db.String(500), nullable=True)
