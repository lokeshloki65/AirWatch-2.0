# AirWatch 2.0 - AI Air Quality Dashboard

AirWatch 2.0 is an AI-powered, animated Air Quality Dashboard that provides real-time data, 5-day forecasts, and intelligent health recommendations. Built with a Python Flask backend and a dynamic JavaScript frontend, it uses the OpenWeatherMap API for data and Google's Gemini API for smart insights.

![AirWatch 2.0 Demo](./demo.gif)
*(Note: Add a screenshot or a GIF named `demo.gif` to your folder for this to display)*

---

## ✨ Key Features

* **🌍 City Search:** Check the air quality for any city worldwide.
* **📍 Geolocation:** Automatically fetch AQI data for your current location.
* **🤖 AI Health Advisor:** Get smart, actionable health recommendations from Google Gemini based on current pollution levels.
* **🗓️ 5-Day Forecast:** View the predicted AQI for the next five days to plan your week.
* **🗺️ Interactive Live Map:** Explore global air quality in real-time on an interactive map powered by Leaflet.js.
* **🔬 Pollutant Deep Dive:** Learn about different pollutants (PM2.5, CO, O3, etc.) in an easy-to-understand accordion section.
* **🎨 Stunning "Aurora" UI:** A beautiful, animated, and responsive dark-mode interface.

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask
* **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
* **APIs & Services:**
    * [OpenWeatherMap API](https://openweathermap.org/api) (for Geocoding, Current AQI & Forecast)
    * [Google Gemini API](https://ai.google.dev/) (for AI Recommendations)
* **Libraries:** Leaflet.js (for the interactive map)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

* Python 3.7+
* An [OpenWeatherMap API Key](https://openweathermap.org/api)
* A [Google Gemini API Key](https://ai.google.dev/tutorials/python_quickstart)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/airwatch-2.0.git](https://github.com/your-username/airwatch-2.0.git)
    cd airwatch-2.0
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    venv\Scripts\activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install Flask requests google-generativeai flask-cors
    ```

4.  **Add your API Keys:**
    Open the `app.py` file and replace the placeholder keys with your actual API keys:
    ```python
    OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY_HERE"
    GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
    ```

5.  **Run the Flask server:**
    ```bash
    python app.py
    ```

6.  **Open the application:**
    Open your web browser and navigate to `http://127.0.0.1:5000/`.

---

## 📁 Project Structure

/AirWatch-2.0 ├── app.py # The Flask backend logic ├── templates/ │ └── index.html # The main HTML file └── static/ ├── css/ │ └── style.css # The "Aurora" theme styles and animations └── js/ └── script.js # Frontend logic, API fetching, map control


---

## 🤝 API Credits

This project would not be possible without these amazing services:

* **Air Quality & Forecast Data:** [OpenWeatherMap](https://openweathermap.org/)
* **AI Health Insights:** [Google Gemini](https://ai.google.dev/)
* **Interactive Map Tiles:** [CARTO](https://carto.com/) & [OpenStreetMap](https://www.openstreetmap.org/)
