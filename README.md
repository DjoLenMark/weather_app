# Приложение прогноза погоды

Веб-приложение на FastAPI для просмотра прогноза погоды с использованием API WeatherAPI.com.

## Особенности

- Поиск погоды по городам с автодополнением
- Светлая и тёмная темы
- История поиска для каждого пользователя
- Статистика запросов по городам
- iOS-подобный дизайн интерфейса
- Адаптивная верстка

## Технологии

- Backend: FastAPI + SQLite
- Frontend: Jinja2 + TailwindCSS
- API: WeatherAPI.com
- Docker для развертывания

## Запуск

### С использованием Docker

```bash
docker-compose up
```

Приложение будет доступно по адресу: http://localhost:8000

### Локальный запуск

1. Установите зависимости:
```bash
pip install -r requirements.txt
```

2. Запустите приложение:
```bash
uvicorn main:app --reload
```

## API Endpoints

- `GET /` - Главная страница
- `GET /api/weather/{city}` - Получение погоды для города
- `GET /api/cities?q={query}` - Поиск городов для автодополнения
- `GET /stats` - Статистика запросов по городам

## Тестирование

Запуск тестов:
```bash
pytest
```

## Структура проекта

```
weather_app/
├── main.py           # Основной файл приложения
├── database.py       # Настройки базы данных
├── models.py         # Модели данных
├── static/          
│   ├── app.js       # JavaScript код
│   └── styles.css   # CSS стили
├── templates/
│   └── index.html   # HTML шаблон
├── tests/
│   └── test_main.py # Тесты
├── Dockerfile       
└── docker-compose.yml
``` 