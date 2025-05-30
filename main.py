from fastapi import FastAPI, Request, Response, Depends, Cookie
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid
import aiohttp
import json

from database import get_async_session, init_db
from models import SearchHistory

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

WEATHER_API_KEY = "6e17eb0519204ee990e193143252305"
WEATHER_API_URL = "http://api.weatherapi.com/v1"

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def home(request: Request, user_id: str | None = Cookie(default=None), last_city: str | None = Cookie(default=None)):
    if not user_id:
        user_id = str(uuid.uuid4())
    
    context = {
        "request": request,
        "user_id": user_id,
        "last_city": last_city
    }
    
    response = templates.TemplateResponse("index.html", context)
    response.set_cookie(key="user_id", value=user_id)
    return response

@app.get("/api/weather/{city}")
async def get_weather(city: str, user_id: str | None = Cookie(default=None), db: AsyncSession = Depends(get_async_session)):
    async with aiohttp.ClientSession() as session:
        # Получаем текущую погоду
        current_params = {
            "key": WEATHER_API_KEY,
            "q": city,
            "aqi": "no"
        }
        # Получаем прогноз на 10 дней
        forecast_params = {
            "key": WEATHER_API_KEY,
            "q": city,
            "days": 10,
            "aqi": "no"
        }
        
        try:
            async with session.get(f"{WEATHER_API_URL}/current.json", params=current_params) as current_response, \
                       session.get(f"{WEATHER_API_URL}/forecast.json", params=forecast_params) as forecast_response:
                
                if current_response.status == 200 and forecast_response.status == 200:
                    current_data = await current_response.json()
                    forecast_data = await forecast_response.json()
                    
                    # Сохраняем поиск в истории
                    search_history = SearchHistory(
                        user_id=user_id,
                        city=city,
                        timestamp=datetime.utcnow()
                    )
                    db.add(search_history)
                    await db.commit()
                    
                    # Комбинируем текущую погоду и прогноз
                    response = {
                        "current": current_data,
                        "forecast": forecast_data["forecast"]["forecastday"]
                    }
                    
                    return response
                else:
                    return JSONResponse(
                        status_code=current_response.status,
                        content={"error": "Failed to fetch weather data"}
                    )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": str(e)}
            )

@app.get("/api/cities")
async def search_cities(q: str):
    async with aiohttp.ClientSession() as session:
        params = {
            "key": WEATHER_API_KEY,
            "q": q
        }
        async with session.get(f"{WEATHER_API_URL}/search.json", params=params) as response:
            if response.status == 200:
                cities = await response.json()
                return cities
            return []

@app.get("/api/history")
async def get_history(user_id: str | None = Cookie(default=None), db: AsyncSession = Depends(get_async_session)):
    if not user_id:
        return {"history": []}
    
    from sqlalchemy import select
    query = select(SearchHistory).where(SearchHistory.user_id == user_id).order_by(SearchHistory.timestamp.desc()).limit(10)
    result = await db.execute(query)
    history = result.scalars().all()
    
    return {
        "history": [
            {
                "city": item.city,
                "timestamp": item.timestamp.isoformat()
            }
            for item in history
        ]
    }

@app.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_async_session)):
    from sqlalchemy import func, select
    query = select(
        SearchHistory.city,
        func.count(SearchHistory.id).label("count")
    ).group_by(SearchHistory.city).order_by(func.count(SearchHistory.id).desc())
    
    result = await db.execute(query)
    stats = result.all()
    return {
        "stats": [
            {
                "city": city,
                "count": count,
            }
            for city, count in stats
        ]
    } 