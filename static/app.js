document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const suggestions = document.getElementById('suggestions');
    const weatherInfo = document.getElementById('weather-info');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Theme handling
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // City search suggestions
    const fetchSuggestions = debounce(async (query) => {
        if (query.length < 2) {
            suggestions.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
            const cities = await response.json();
            
            suggestions.innerHTML = '';
            cities.forEach(city => {
                const div = document.createElement('div');
                div.className = 'suggestion-item text-gray-900 dark:text-white';
                div.textContent = `${city.name}, ${city.country}`;
                div.addEventListener('click', () => {
                    cityInput.value = city.name;
                    suggestions.classList.add('hidden');
                    fetchWeather(city.name);
                });
                suggestions.appendChild(div);
            });
            
            suggestions.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }, 300);

    // Weather data fetching
    async function fetchWeather(city) {
        try {
            const response = await fetch(`/api/weather/${encodeURIComponent(city)}`);
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('city-name').textContent = `${data.location.name}, ${data.location.country}`;
                document.getElementById('temperature').textContent = `${data.current.temp_c}°C`;
                document.getElementById('condition').textContent = data.current.condition.text;
                document.getElementById('humidity').textContent = `${data.current.humidity}%`;
                document.getElementById('wind').textContent = `${data.current.wind_kph} км/ч`;
                document.getElementById('weather-icon').src = `https:${data.current.condition.icon}`;
                
                weatherInfo.classList.remove('hidden');
            } else {
                alert('Не удалось получить данные о погоде. Попробуйте другой город.');
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            alert('Произошла ошибка при получении данных о погоде.');
        }
    }

    // Event listeners
    cityInput.addEventListener('input', (e) => fetchSuggestions(e.target.value));
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && cityInput.value) {
            suggestions.classList.add('hidden');
            fetchWeather(cityInput.value);
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!suggestions.contains(e.target) && e.target !== cityInput) {
            suggestions.classList.add('hidden');
        }
    });

    // Check for last searched city in cookie
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});

    if (cookies.last_city) {
        cityInput.value = decodeURIComponent(cookies.last_city);
        fetchWeather(decodeURIComponent(cookies.last_city));
    }
}); 