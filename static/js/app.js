document.addEventListener('DOMContentLoaded', () => {
    const citySearch = document.getElementById('citySearch');
    const suggestions = document.getElementById('suggestions');
    const weatherInfo = document.getElementById('weatherInfo');
    const forecast = document.getElementById('forecast');
    const searchHistory = document.getElementById('searchHistory');
    const searchStats = document.getElementById('searchStats');
    const themeToggle = document.getElementById('themeToggle');

    let theme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', theme);

    // Переключение темы
    themeToggle.addEventListener('click', () => {
        theme = theme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    // Автодополнение
    let debounceTimer;
    citySearch.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
                const cities = await response.json();
                
                suggestions.innerHTML = cities.map(city => `
                    <div class="suggestion-item" data-city="${city.name}">
                        ${city.name}, ${city.country}
                    </div>
                `).join('');
                
                suggestions.style.display = cities.length ? 'block' : 'none';
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        }, 300);
    });

    // Выбор города из подсказок
    suggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (item) {
            const city = item.dataset.city;
            citySearch.value = city;
            suggestions.style.display = 'none';
            fetchWeather(city);
        }
    });

    // Получение погоды
    async function fetchWeather(city) {
        try {
            const response = await fetch(`/api/weather/${encodeURIComponent(city)}`);
            const data = await response.json();
            
            if (response.ok) {
                displayWeather(data.current);
                displayForecast(data.forecast);
                updateHistory();
                updateStats();
            } else {
                throw new Error(data.error || 'Failed to fetch weather data');
            }
        } catch (error) {
            console.error('Error:', error);
            weatherInfo.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    // Отображение текущей погоды
    function displayWeather(weather) {
        weatherInfo.innerHTML = `
            <div class="current-weather">
                <h2>${weather.location.name}, ${weather.location.country}</h2>
                <div class="weather-main">
                    <img src="${weather.current.condition.icon}" alt="${weather.current.condition.text}">
                    <div class="temperature">${weather.current.temp_c}°C</div>
                </div>
                <div class="weather-details">
                    <div class="detail">
                        <span>Ощущается как</span>
                        <span>${weather.current.feelslike_c}°C</span>
                    </div>
                    <div class="detail">
                        <span>Влажность</span>
                        <span>${weather.current.humidity}%</span>
                    </div>
                    <div class="detail">
                        <span>Ветер</span>
                        <span>${weather.current.wind_kph} км/ч</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Отображение прогноза на 10 дней
    function displayForecast(forecastData) {
        forecast.innerHTML = `
            <h3>Прогноз на 10 дней</h3>
            <div class="forecast-grid">
                ${forecastData.map(day => `
                    <div class="forecast-day">
                        <div class="date">${new Date(day.date).toLocaleDateString('ru-RU', {weekday: 'short', month: 'short', day: 'numeric'})}</div>
                        <img src="${day.day.condition.icon}" alt="${day.day.condition.text}">
                        <div class="temp-range">
                            <span class="temp-max">${day.day.maxtemp_c}°</span>
                            <span class="temp-min">${day.day.mintemp_c}°</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Обновление истории поиска
    async function updateHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            searchHistory.innerHTML = data.history.map(item => `
                <li class="list-group-item">
                    <span class="city-name">${item.city}</span>
                    <small class="text-muted">${new Date(item.timestamp).toLocaleString('ru-RU')}</small>
                </li>
            `).join('');
        } catch (error) {
            console.error('Error updating history:', error);
        }
    }

    // Обновление статистики
    async function updateStats() {
        try {
            const response = await fetch('/stats');
            const data = await response.json();
            
            searchStats.innerHTML = data.stats.map(item => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${item.city}
                    <span class="badge bg-primary rounded-pill">${item.count}</span>
                </li>
            `).join('');
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Инициализация
    updateHistory();
    updateStats();
}); 