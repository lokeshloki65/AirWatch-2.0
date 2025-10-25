document.addEventListener('DOMContentLoaded', () => {

    // --- Element References ---
    const citySearchForm = document.getElementById('citySearchForm');
    const cityInput = document.getElementById('cityInput');
    const getLocationBtn = document.getElementById('getLocationBtn');
    
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');
    const initialStateDiv = document.getElementById('initialState');
    const resultsDiv = document.getElementById('results');
    const dashboard = document.getElementById('dashboard');

    const locationName = document.getElementById('locationName');
    const aqiValueDiv = document.getElementById('aqi-value');
    const aqiStatusDiv = document.getElementById('aqi-status');
    const aqiBadgeContainer = document.getElementById('aqi-badge-container');
    const pollutantsDiv = document.getElementById('pollutants');
    const recommendationsDiv = document.getElementById('recommendations');
    const forecastDiv = document.getElementById('forecast');

    // --- Leaflet Map Initialization ---
    let map;
    try {
        map = L.map('map').setView([20.5937, 78.9629], 5); // Default view (India)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
    } catch (e) {
        console.error("Failed to initialize map:", e);
        document.getElementById('map-view').innerHTML = '<p class="text-center text-red-400">Could not load the map.</p>';
    }

    // --- AQI Data ---
    const aqiMap = {
        1: { text: 'Good', className: 'aqi-1', color: '#10b981', neon: 'neon-green' },
        2: { text: 'Fair', className: 'aqi-2', color: '#fbbf24', neon: 'neon-yellow' },
        3: { text: 'Moderate', className: 'aqi-3', color: '#f97316', neon: 'neon-orange' },
        4: { text: 'Poor', className: 'aqi-4', color: '#ef4444', neon: 'neon-red' },
        5: { text: 'Very Poor', className: 'aqi-5', color: '#a855f7', neon: 'neon-purple' }
    };
    
    const pollutantIcons = {
        co: 'fa-cloud',
        no: 'fa-smog',
        no2: 'fa-industry',
        o3: 'fa-sun',
        so2: 'fa-smog',
        pm2_5: 'fa-atom',
        pm10: 'fa-wind',
        nh3: 'fa-flask'
    };

    // --- Event Listeners ---

    // City Search
    citySearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            fetchData({ city: city });
        }
    });

    // Geolocation Button
    getLocationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchData({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (err) => {
                    showError(`Geolocation Error: ${err.message}`);
                }
            );
        } else {
            showError("Geolocation is not supported by this browser.");
        }
    });

    // Accordion
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('active');
        });
    });

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal-up');
    const revealOnScroll = () => {
        reveals.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 100;
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // --- Main Data Fetching Function ---
    async function fetchData(params) {
        showLoading();
        
        let url = '/get_aqi_data?';
        if (params.city) {
            url += `city=${encodeURIComponent(params.city)}`;
        } else if (params.lat && params.lon) {
            url += `lat=${params.lat}&lon=${params.lon}`;
        } else {
            showError("Invalid parameters provided.");
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            updateUI(data);

            // Scroll to dashboard
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            showError(`Failed to fetch data: ${error.message}`);
        } finally {
            hideLoading();
        }
    }

    // --- UI Update Functions ---

    function updateUI(data) {
        // Show results, hide others
        resultsDiv.classList.remove('hidden');
        initialStateDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');

        // 1. Update Location Name
        locationName.textContent = data.location_name;

        // 2. Update Current AQI
        const aqi = data.current.aqi_index;
        const aqiData = aqiMap[aqi];
        
        aqiValueDiv.textContent = aqi;
        aqiStatusDiv.textContent = aqiData.text;
        
        // Apply color and neon effect
        aqiValueDiv.className = `text-9xl font-black mb-3 ${aqiData.color} ${aqiData.neon}`;
        
        aqiBadgeContainer.innerHTML = `<span class="aqi-badge ${aqiData.className}"><i class="fas fa-wind"></i>${aqiData.text}</span>`;

        // 3. Update Pollutants
        pollutantsDiv.innerHTML = '';
        for (const [key, value] of Object.entries(data.current.pollutants)) {
            const icon = pollutantIcons[key] || 'fa-circle';
            const pollutantEl = document.createElement('div');
            pollutantEl.className = 'pollutant-card';
            pollutantEl.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas ${icon} text-blue-400 mr-4 text-xl w-6 text-center"></i>
                        <strong class="text-white text-lg">${key.toUpperCase().replace('_', '.')}</strong>
                    </div>
                    <span class="text-xl font-bold text-gray-300">${value.toFixed(2)}</span>
                </div>
            `;
            pollutantsDiv.appendChild(pollutantEl);
        }

        // 4. Update AI Recommendations
        recommendationsDiv.innerHTML = data.recommendations.replace(/\\n/g, '<br>');

        // 5. Update 5-Day Forecast
        forecastDiv.innerHTML = '';
        data.forecast.forEach(day => {
            const dayAqiData = aqiMap[day.aqi];
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

            const forecastEl = document.createElement('div');
            forecastEl.className = 'forecast-card';
            forecastEl.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-lg font-bold text-white">${dayName}</div>
                        <div class="text-sm text-gray-400">${dayAqiData.text}</div>
                    </div>
                    <div class="aqi-value-small ${dayAqiData.className}">
                        AQI ${day.aqi}
                    </div>
                </div>
            `;
            forecastDiv.appendChild(forecastEl);
        });

        // 6. Update Map
        if (map && data.coords) {
            const { lat, lon } = data.coords;
            map.setView([lat, lon], 13);
            
            // Clear existing markers
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // Add new marker
            const marker = L.marker([lat, lon]).addTo(map);
            marker.bindPopup(`
                <h4>${data.location_name}</h4>
                <p><strong>AQI: ${aqi} (${aqiData.text})</strong></p>
            `).openPopup();
        }
    }

    function showLoading() {
        loadingDiv.classList.remove('hidden');
        initialStateDiv.classList.add('hidden');
        resultsDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
    }

    function hideLoading() {
        loadingDiv.classList.add('hidden');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
        initialStateDiv.classList.add('hidden');
        resultsDiv.classList.add('hidden');
    }

});