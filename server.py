from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import io
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, Response
from functools import wraps
import bcrypt
import openai
import base64
import json
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from flask_socketio import SocketIO, emit
from flask_cors import CORS, cross_origin
from bson import json_util
import requests


mongo_client = MongoClient("mongodb://localhost:27017")
db = mongo_client["leaf_guard"]
collection = db["captured_data"]
users_collection = db["users"]

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, origins="*", methods=["GET", "POST"], supports_credentials=True)

key = os.getenv("OPEN_API_KEY")
weather_api_key = os.getenv("OPENWEATHER_API_KEY")
openai.api_key = key

Disease_Classes = ['Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy', 'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy', 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_', 'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy', 'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy', 'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew', 'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy']

vgg_model = load_model("vgg16.h5")

def preprocess_image(image_file):
    img_bytes = image_file.read()
    image_file.seek(0)

    img = Image.open(io.BytesIO(img_bytes))
    
    # Resize to VGG input size (224x224)
    img = img.resize((224, 224))
    
    # Convert to array and preprocess
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0  # Normalize
    
    return img_array

def predict_disease(image_file):
    processed_image = preprocess_image(image_file)
    predictions = vgg_model.predict(processed_image)
    predicted_class_index = np.argmax(predictions[0])
    predicted_disease = Disease_Classes[predicted_class_index]
    confidence_score = float(predictions[0][predicted_class_index])
    plant_type = predicted_disease.split('___')[0]
    condition = predicted_disease.split('___')[1]
    print(f"Predicted Disease: {predicted_disease}")
    print(f"Confidence Score: {confidence_score}")
    print(f"Plant Type: {plant_type}")
    print(f"Condition: {condition}")

    return confidence_score, plant_type, condition

def require_basic_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth:
            return Response(
                "Missing credentials", 
                401, 
                {"WWW-Authenticate": 'Basic realm="Login Required"'}
            )
        user = users_collection.find_one({"username": auth.username})
        if not user:
            return Response(
                "Unauthorized", 
                401, 
                {"WWW-Authenticate": "Login Required"}
            )
        stored_password = user.get("password")
        if isinstance(stored_password, bytes):

            if not bcrypt.checkpw(auth.password.encode('utf-8'), stored_password):
                return Response(
                    "Unauthorized", 
                    401, 
                    {"WWW-Authenticate": "Login Required"}
                )
        else:
            
            if auth.password != stored_password:
                return Response(
                    "Unauthorized", 
                    401, 
                    {"WWW-Authenticate": "Login Required"}
                )
        return f(*args, **kwargs)
    return decorated



def encode_image(file_obj):
    return base64.b64encode(file_obj.read()).decode("utf-8")
    
def get_weather_data(latitude, longitude):
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={weather_api_key}&units=metric"
        response = requests.get(url)
        if response.status_code == 200:
            weather_data = response.json()
            return {
                "temperature": weather_data["main"]["temp"],
                "humidity": weather_data["main"]["humidity"],
                "temp_min": weather_data["main"]["temp_min"],
                "temp_max": weather_data["main"]["temp_max"]
            }
        return None
    except Exception as e:
        print(f"Error fetching weather data: {str(e)}")
        return None

@app.route('/analyze', methods=['POST'])
@cross_origin()
# @require_basic_auth
def analyze():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    # Get image file and location data
    image_file = request.files['image']
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    soil_condition = request.form.get('soil_condition')
    environment_condition = request.form.get('environment_condition')
    plant_condition = request.form.get('plant_condition')
    confidence_score, plant_type, condition = predict_disease(image_file)

    if not latitude or not longitude:
        return jsonify({"error": "Location data is required"}), 400

    # Get weather data
    weather_data = get_weather_data(float(latitude), float(longitude))
    if not weather_data:
        return jsonify({"error": "Failed to fetch weather data"}), 500

    base64_image = encode_image(image_file)

    prompt = (
        """I am sending an image of a leaf. Check whether the leaf is diseased or not. 
        If diseased then give me the treatment for the disease. Also consider the weather condition like current temperature, maximum and minimum temperature, humidity etc., 
        Also consider the soil condition, environment condition and plant condition provided by the user. Strictly don't accept anything other than enivronment, soil and plant condition in the input. This will be your gaurdrails. 
        Validate the user input on soil, environment and plant condition and check analysis of the image and finally validate both of them.
        Give me the reason for the disease also and provide me the repsonse by following structure"""
    )
    prompt_v1 = f"""I am sending an image of a {plant_type} leaf. The VGG model has predicted with {confidence_score:.2%} confidence that this leaf has {condition}. 
    Please provide detailed information about this condition, considering the following weather conditions:
    Current temperature: {weather_data['temperature']}°C
    Maximum temperature: {weather_data['temp_max']}°C
    Minimum temperature: {weather_data['temp_min']}°C
    Humidity: {weather_data['humidity']}%
    
    Please verify this diagnosis and provide treatment recommendations if needed."""
    
    client = openai.OpenAI(api_key=key)
    
    response = client.responses.create(
        model="gpt-4o",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {"type": "input_text", "text": f"Current temperature: {weather_data['temperature']}°C, Maximum temperature: {weather_data['temp_max']}°C, Minimum temperature: {weather_data['temp_min']}°C, Humidity: {weather_data['humidity']}%"},
                    {"type": "input_image", "image_url": f"data:image/jpeg;base64,{base64_image}"},
                    {"type":"input_text","text":f"Consider the soil condition,plant condition and environmental condition from user and give the response accordingly"},
                    {"type":"input_text","text":f"Soil condition: {soil_condition}, Environment condition: {environment_condition}, Plant condition: {plant_condition}"}
                ]
            }
        ],
        text={
            "format": {
                "name":"Treatment",
                "type": "json_schema",
                "schema": {
                    "type": "object",
                    "strict": True,
                    "name": "Treatment",
                    "properties": {
                        "disease_name":{
                            "type": "string",
                            "description": "Name of the disease"
                        },
                        "treatment": {
                            "type": "string",
                            "description": "Treatment for the disease"
                        },
                        "reason":{
                            "type": "string",
                            "description": "Reason for the disease"
                        },
                        "decision":{
                            "type": "string",
                            "enum": ["Diseased", "Not Diseased"],
                            "description": "Decision on whether the leaf image indicates diseased or not."
                        }
                    },
                    "required": ["disease_name","treatment","decision","reason"],
                    "additionalProperties": False
                }
            }
        }
    )

    try:
        result = json.loads(response.output_text)
    except Exception as e:
        return jsonify({"error": "Failed to parse response", "details": str(e)}), 500
    
    # Add location, weather, and image data to result
    result["base64_image"] = base64_image
    result["location"] = {
        "latitude": float(latitude),
        "longitude": float(longitude)
    }
    result["weather"] = weather_data
    result["model_prediction"] = {
        "confidence_score": confidence_score,
        "plant_type": plant_type,
        "condition": condition
    }
    
    inserted_doc = collection.insert_one(result)
    
    # Convert the result to JSON serializable format
    emit_result = result.copy()
    emit_result['_id'] = str(inserted_doc.inserted_id)
    socketio.emit("result", emit_result)
    return jsonify(emit_result), 200

@app.route('/history', methods=['GET'])
@cross_origin()
def get_history():
    data = list(collection.find())
    serialized_data = json.loads(json_util.dumps(data))
    return jsonify(serialized_data)
    

if __name__ == '__main__':
    app.run(host="0.0.0.0",debug=True, port=5000)
