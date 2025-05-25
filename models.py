from sqlalchemy import Column, Integer, String, DateTime
from database import Base

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    city = Column(String)
    timestamp = Column(DateTime) 