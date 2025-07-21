from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import yfinance as yf
import pandas_ta as ta
from .model import load_model
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="StockWise.AI ML Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model()

class StockData(BaseModel):
    ticker: str

def get_latest_stock_data(ticker: str):
    stock = yf.Ticker(ticker)
    df = stock.history(period="2y")

    if df.empty:
        raise ValueError(f"Could not fetch data for '{ticker}'.")

    df.ta.rsi(length=14, append=True)
    df.ta.sma(length=50, append=True)
    df.ta.sma(length=200, append=True)
    latest_data = df.dropna().iloc[-1:]
    
    feature_names = ['RSI_14', 'EMA_50', 'EMA_200', 'MACD_12_26_9']
    if not all(feature in latest_data.columns for feature in feature_names):
        raise ValueError("Could not calculate indicators. Not enough historical data.")

    return latest_data[feature_names]

@app.post("/predict")
def predict_stock(data: StockData):
    try:
        features_df = get_latest_stock_data(data.ticker)
        prediction_raw = model.predict(features_df)
        prediction_proba = model.predict_proba(features_df)
        
        prob_down = prediction_proba[0][0]
        
        if prediction_raw[0] == 1:
            recommendation = "Buy"
            confidence = prediction_proba[0][1] * 100
        else:
            if prob_down > 0.6:
                recommendation = "Sell"
                confidence = prob_down * 100
            else:
                recommendation = "Hold"
                confidence = (1 - prob_down) * 100
        
        return { "ticker": data.ticker, "recommendation": recommendation, "confidence_score": f"{confidence:.2f}%" }
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def read_root():
    return {"message": "Welcome to the StockWise.AI Live Prediction API"}