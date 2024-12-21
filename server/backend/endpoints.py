from flask import request, jsonify
from models import db, User, Image
from werkzeug.security import generate_password_hash, check_password_hash
import logging
import base64

def register_routes(app):

    @app.route('/register', methods=['POST'])
    def register_user():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username already exists!"}), 400

        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User registered successfully!", "username":username}), 201

    @app.route('/login', methods=['POST'])
    def login_user():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            return jsonify({"message": "Login successful!", "username":username}), 200
        return jsonify({"message": "Invalid username or password!"}), 401

    @app.route('/api/save', methods=['POST'])
    def save_image():
        logging.debug("Received request for /api/save")
        data = request.get_json()

        if not data:
            print("No data received")
            return jsonify({'message': 'No data provided'}), 400

        username = data.get('username')
        image_data = data.get('imageData')
        prompt = data.get('prompt')
        isPublic = data.get('isPublic')
        tags = data.get('tags')

        missing_fields = []
        if not username:
            missing_fields.append("username")
        if not image_data:
            missing_fields.append("imageData")
        if prompt is None:
            missing_fields.append("prompt")
        if isPublic is None:
            missing_fields.append("isPublic")
        if not tags:
            missing_fields.append("tags")

        if missing_fields:
            missing_fields_str = ", ".join(missing_fields)
            print(f"Missing one or more required fields: {missing_fields_str}")
            return jsonify({'message': f'Missing required fields: {missing_fields_str}'}), 400

        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"User not found: {username}")
            return jsonify({'message': 'User not found'}), 404

        try:
            logging.debug("Attempting to decode and save image data")
            # Decode base64 string to binary data
            decoded_image_data = base64.b64decode(image_data.split(",")[1])
            new_image = Image(
                username=username,
                data=decoded_image_data,
                prompt=prompt,
                isPublic=isPublic,
                tags=tags
            )
            db.session.add(new_image)
            db.session.flush()  

            # Generate the URL using username and new image id
            new_image.url = f"https://{username}/{new_image.id}"
            
            db.session.commit()
            print("Image data saved successfully")
            return jsonify({'message': 'Image data saved successfully!', 'url': new_image.url}), 201
        except Exception as e:
            db.session.rollback()  # Roll back in case of error
            print(f"Error saving image: {str(e)}")
            return jsonify({'message': str(e)}), 500

    @app.route('/api/public')
    def get_public_images():
        logging.debug("Fetching public images from the database")
        images = Image.query.filter_by(isPublic=True).all()
        if not images:
            print("No public images found")
            return jsonify({'message': 'No public images found!'}), 404

        image_data = []
        for image in images:
            logging.debug(f"Processing image ID: {image.id}")
     
            encoded_image = base64.b64encode(image.data).decode('utf-8')  
            image_data.append({
                'id': str(image.id), 
                'url': f"data:image/jpeg;base64,{encoded_image}",  
                'alt': image.prompt,  
                'likes': len(image.liked_by),  
                'comments': image.comments,
                'username': image.username,
                'prompt': image.prompt,
                'tags': image.tags.split(',') if image.tags else [] 
            })

        print(f"Returning {len(image_data)} public images")
        return jsonify({'images': image_data}), 200

    @app.route('/api/user', methods=['GET'])
    def get_user_images():
        logging.debug("Received request for /api/user")
        username = request.args.get('username')
        logging.debug(f"Fetching images for user: {username}")
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"User not found: {username}")
            return jsonify({'message': 'User not found'}), 404

        images = Image.query.filter_by(username=username).all()
        if not images:
            print(f"No images found for user: {username}")
            return jsonify({'message': 'No images found for this user!'}), 404

        image_data = []
        for image in images:
            logging.debug(f"Processing image ID: {image.id}")
      
            encoded_image = base64.b64encode(image.data).decode('utf-8')  
            image_data.append({
                'id': str(image.id),  
                'url': f"data:image/jpeg;base64,{encoded_image}",  
                'alt': image.prompt,  
                'likes': len(image.liked_by), 
                'comments': image.comments,
                'username': image.username,
                'prompt': image.prompt,
                'tags': image.tags.split(',') if image.tags else []  
            })

        print(f"Returning {len(image_data)} images for user: {username}")
        return jsonify({'images': image_data}), 200

    @app.route('/api/like', methods=['POST'])
    def like_image():
        data = request.get_json()
        image_id = data['imageId']
        username = data['username']
        image = Image.query.get(image_id)
        user = User.query.filter_by(username=username).first()
        if image and user:
            # Check if the user has already liked the image
            if user in image.liked_by:
                print(f"User {username} already liked image {image_id}")
                return jsonify({'message': 'Image already liked'}), 400

            image.liked_by.append(user)
            db.session.commit()
            print(f"User {username} liked image {image_id}")
            return jsonify({'message': 'Liked successfully', 'likes': len(image.liked_by)}), 200
        else:
            print(f"Image or user not found: image_id={image_id}, username={username}")
            return jsonify({'message': 'Image or user not found'}), 404

    @app.route('/api/unlike', methods=['POST'])
    def unlike_image():
        data = request.get_json()
        image_id = data['imageId']
        username = data['username']
        image = Image.query.get(image_id)
        user = User.query.filter_by(username=username).first()
        if image and user:
            # Check if the user has liked the image
            if user not in image.liked_by:
                print(f"User {username} has not liked image {image_id}")
                return jsonify({'message': 'Image not liked'}), 400

            image.liked_by.remove(user)
            db.session.commit()
            print(f"User {username} unliked image {image_id}")
            return jsonify({'message': 'Unliked successfully', 'likes': len(image.liked_by)}), 200
        else:
            print(f"Image or user not found: image_id={image_id}, username={username}")
            return jsonify({'message': 'Image or user not found'}), 404

    @app.route('/api/comment', methods=['POST'])
    def comment_image():
        data = request.get_json()
        image_id = data.get('image_id')
        comment = data.get('comment')

        image = Image.query.filter_by(id=image_id).first()
        if not image:
            print(f"Image not found: {image_id}")
            return jsonify({'message': 'Image not found'}), 404

        if image.comments:
            image.comments += f"\n{comment}"
        else:
            image.comments = comment

        db.session.commit()
        print(f"Comment added to image {image_id}")

        return jsonify({'message': 'Comment added successfully!'}), 200

    @app.route('/api/isliked', methods=['GET'])
    def is_liked():
        image_id = request.args.get('imageId')
        username = request.args.get('username')
        image = Image.query.get(image_id)
        user = User.query.filter_by(username=username).first()
        if image and user:
            is_liked = user in image.liked_by
            return jsonify({'isLiked': is_liked}), 200
        else:
            return jsonify({'message': 'Image or user not found'}), 404