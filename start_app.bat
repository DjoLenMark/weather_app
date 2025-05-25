@echo off
echo Starting Weather App...

:: Проверяем наличие виртуального окружения
IF EXIST "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) ELSE (
    echo Virtual environment not found, using system Python...
)

:: Проверяем установлен ли uvicorn
python -c "import uvicorn" 2>NUL
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
)

:: Запускаем приложение
echo Starting server...
python -m uvicorn main:app --reload

:: Если сервер остановлен, ждем нажатия клавиши
echo.
echo Server stopped. Press any key to exit...
pause >nul 