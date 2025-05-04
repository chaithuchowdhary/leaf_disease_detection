# 🌿 Plant Leaf Disease Detection System

## 📋 Overview
This is an advanced plant disease detection system that combines deep learning (VGG16) with OpenAI's language models to provide comprehensive analysis of plant leaf diseases. The application uses a modern React TypeScript frontend and Flask backend, featuring real-time disease detection, detailed analysis, and natural language interaction for plant health insights.

## ⭐ Key Features
- 🔍 Detection of 33 different plant leaf diseases using VGG16 model
- 🤖 OpenAI LLM integration for detailed disease analysis and recommendations
- 💬 Natural Language Processing for user queries about plant health
- 🌤️ Weather condition correlation with plant diseases
- 📸 Real-time image processing and analysis
- 📊 Comprehensive disease information and treatment suggestions
- 🎨 User-friendly interface with drag-and-drop image upload

## 🎯 Disease Detection Capabilities
- Trained on 33 different classes of plant leaf diseases
- High accuracy disease classification
- Real-time analysis and results
- Detailed disease descriptions and causes
- Environmental factor analysis
- Treatment recommendations
- Preventive measures

## 📌 Prerequisites
- 📦 Node.js (v16 or higher)
- 🐍 Python 3.8 or higher
- 📦 npm or yarn package manager
- 🔄 Git
- 📊 VGG16 pre-trained model (included as vgg16.h5)
- 🔑 OpenAI API key

## 🚀 Installation

### 📥 Cloning the Repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 🔧 Backend Setup
1. Create and activate a Python virtual environment:
```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Unix or MacOS
source venv/bin/activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the root directory and add:
```
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY = 1234567890 # for flask App
OPENWEATHER_API_KEY = your_openweather_api_key
```

### 🛠️ Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

## 🚀 Running the Application

### 🌐 Start the Backend Server
From the root directory (with virtual environment activated):
```bash
python server.py
```
The Flask server will start on `http://localhost:5000`

### 💻 Start the Frontend Development Server
In a new terminal, from the frontend directory:
```bash
cd frontend
npm start
```
The React development server will start on `http://localhost:3000`

## 💡 How to Use
1. 📸 Upload a leaf image through the drag-and-drop interface
2. 🔄 Wait for the VGG16 model to analyze the image
3. 📋 View the detected disease and confidence score
4. 💬 Get detailed information about:
   - Disease description
   - Causes and symptoms
   - Environmental factors
   - Treatment recommendations
5. ❓ Ask natural language questions about the disease or plant health

## 📁 Project Structure
```
├── frontend/                # React TypeScript frontend
│   ├── src/                # Source files
│   ├── public/             # Public assets
│   └── package.json        # Frontend dependencies
├── server.py               # Flask backend server
├── requirements.txt        # Python dependencies
├── vgg16.h5               # Pre-trained VGG16 model
└── README.md              # Project documentation
```

## 🛠️ Technologies Used
- **Frontend**:
  - ⚛️ React 19
  - 📝 TypeScript
  - 🔌 Socket.IO Client
  - 📁 React-Dropzone
  - 💅 Emotion (CSS-in-JS)

- **Backend**:
  - 🌶️ Flask
  - 🔄 Flask-CORS
  - 🔌 Flask-SocketIO
  - 🤖 OpenAI LLM
  - 🧠 VGG16 Neural Network
  - 🔐 Python-dotenv

## 👥 Contributing
Feel free to submit issues and enhancement requests.

