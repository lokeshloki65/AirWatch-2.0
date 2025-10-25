import os
import sys
import requests
import google.generativeai as genai
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Configuration ---
# !!! IMPORTANT: REPLACE with your actual API keys !!!
OPENWEATHER_API_KEY = "572cd90c14672da8659a51eea1a93d25"
GEMINI_API_KEY = "AIzaSyDE4vioKGav0xSz3rwIzGheQ4j0XQ5eEcE" 

# --- Pre-run Check for API Keys ---
if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "YOUR_OPENWEATHER_API_KEY_HERE":
    print("Error: OPENWEATHER_API_KEY is not set.")
    sys.exit(1)

if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
    print("Error: GEMINI_API_KEY is not set.")
    sys.exit(1)

# Configure the Gemini API
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    model = None

# --- App Routes ---

@app.route('/')
def home():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/get_aqi_data')
def get_aqi_data():
    """
    Smarter API endpoint.
    Fetches location (from city or lat/lon), current air quality,
    forecasted air quality, and AI recommendations in one go.
    """
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    city = request.args.get('city')
    
    location_name = ""
    coords = {}

    try:
        # --- 1. Get Coordinates ---
        if city:
            # Geocode city name to lat/lon
            geocode_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
            geocode_response = requests.get(geocode_url)
            geocode_response.raise_for_status()
            geocode_data = geocode_response.json()
            
            if not geocode_data:
                return jsonify({"error": f"City not found: {city}"}), 404
            
            lat = geocode_data[0]['lat']
            lon = geocode_data[0]['lon']
            location_name = geocode_data[0].get('name', city)
            if 'state' in geocode_data[0] and 'country' in geocode_data[0]:
                 location_name = f"{geocode_data[0]['name']}, {geocode_data[0]['state']}, {geocode_data[0]['country']}"
            elif 'country' in geocode_data[0]:
                 location_name = f"{geocode_data[0]['name']}, {geocode_data[0]['country']}"

        elif lat and lon:
            # Reverse geocode lat/lon to get location name
            reverse_geocode_url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit=1&appid={OPENWEATHER_API_KEY}"
            reverse_geocode_response = requests.get(reverse_geocode_url)
            reverse_geocode_response.raise_for_status()
            reverse_geocode_data = reverse_geocode_response.json()
            
            if reverse_geocode_data:
                location_name = reverse_geocode_data[0].get('name', 'Your Location')
                if 'state' in reverse_geocode_data[0] and 'country' in reverse_geocode_data[0]:
                    location_name = f"{reverse_geocode_data[0]['name']}, {reverse_geocode_data[0]['state']}, {reverse_geocode_data[0]['country']}"
                elif 'country' in reverse_geocode_data[0]:
                     location_name = f"{reverse_geocode_data[0]['name']}, {reverse_geocode_data[0]['country']}"
            else:
                location_name = "Your Location"
        else:
            return jsonify({"error": "City or Latitude/Longitude are required"}), 400

        coords = {"lat": float(lat), "lon": float(lon)}

        # --- 2. Fetch Current Air Quality ---
        current_aq_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
        current_response = requests.get(current_aq_url)
        current_response.raise_for_status()
        current_data = current_response.json()
        
        if not current_data or 'list' not in current_data or not current_data['list']:
            return jsonify({"error": "Invalid current AQI data from API."}), 500

        current_aqi_data = current_data['list'][0]
        current_result = {
            "aqi_index": current_aqi_data['main']['aqi'],
            "pollutants": current_aqi_data['components']
        }
        
        # --- 3. Fetch Forecasted Air Quality ---
        forecast_aq_url = f"http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
        forecast_response = requests.get(forecast_aq_url)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        if not forecast_data or 'list' not in forecast_data:
             return jsonify({"error": "Invalid forecast AQI data from API."}), 500

        # Process forecast to get daily max AQI for next 5 days
        daily_forecasts = {}
        for item in forecast_data['list']:
            day = item['dt'] // (24 * 3600) # Group by day
            if day not in daily_forecasts:
                daily_forecasts[day] = {"dt": item['dt'], "aqi_values": []}
            daily_forecasts[day]["aqi_values"].append(item['main']['aqi'])

        forecast_result = []
        # Sort by day and get max AQI
        for day in sorted(daily_forecasts.keys())[1:6]: # Get next 5 days
             forecast_result.append({
                 "dt": daily_forecasts[day]['dt'],
                 "aqi": max(daily_forecasts[day]['aqi_values'])
             })

        # --- 4. Generate Health Recommendations ---
        recommendations = ""
        if model:
            try:
                prompt = f"""
                The current Air Quality Index (AQI) is {current_result['aqi_index']}.
                The pollutant levels (in μg/m³) are: {current_result['pollutants']}.
                Provide clear, concise, and actionable health recommendations for a general audience.
                Structure your response as a short paragraph.
                Focus on advice about outdoor activities, window ventilation, mask usage, and
                notes for sensitive groups (children, elderly, people with respiratory issues).
                Do not repeat the AQI or pollutant data. Keep it human-friendly.
                """
                response = model.generate_content(prompt)
                recommendations = response.text.replace('*', '').replace('\n', '\\n')
            except Exception as e:
                print(f"Gemini Error: {e}")
                recommendations = "AI recommendations could not be generated at this time."
        else:
            recommendations = "AI model is not configured."


        # --- 5. Combine and return all data ---
        final_result = {
            "location_name": location_name,
            "coords": coords,
            "current": current_result,
            "forecast": forecast_result,
            "recommendations": recommendations
        }
        
        return jsonify(final_result)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"API request failed: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"An internal server error occurred: {e}"}), 500


# --- Run the App ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)