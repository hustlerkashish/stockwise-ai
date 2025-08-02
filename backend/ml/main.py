from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import yfinance as yf
import pandas_ta as ta
from .model import load_model
from fastapi.middleware.cors import CORSMiddleware
from typing import List

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

class Tickers(BaseModel):
    tickers: List[str]

@app.post("/prices/batch")
async def get_batch_prices(data: Tickers):
    """
    A new, highly efficient endpoint to fetch the latest price data
    for a list of tickers in a single API call.
    """
    try:
        # yfinance is highly efficient at fetching multiple tickers at once
        tickers_data = yf.Tickers(data.tickers)
        
        results = {}
        # We use .info which is faster for current market data
        for ticker_str in data.tickers:
            ticker_obj = tickers_data.tickers[ticker_str]
            info = ticker_obj.info
            
            price = info.get('currentPrice', info.get('regularMarketPrice'))
            prev_close = info.get('previousClose')

            if price and prev_close:
                change = price - prev_close
                percent_change = (change / prev_close) * 100
                results[ticker_str] = {
                    "price": round(price, 2),
                    "change": round(change, 2),
                    "percent_change": round(percent_change, 2)
                }
            else:
                # Fallback to history if .info fails
                hist = ticker_obj.history(period="2d")
                if not hist.empty and len(hist) > 1:
                    price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2]
                    change = price - prev_close
                    percent_change = (change / prev_close) * 100
                    results[ticker_str] = {
                        "price": round(price, 2),
                        "change": round(change, 2),
                        "percent_change": round(percent_change, 2)
                    }

        return results
    except Exception as e:
        return {"error": str(e)}

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
    
@app.get("/price/{ticker}")
async def get_live_price(ticker: str):
    """
    A new, lightweight endpoint to fetch only the latest stock price.
    """
    try:
        stock = yf.Ticker(ticker)
        # 'regularMarketPrice' is one of the fastest ways to get the current price
        # 'info' can be slow, so we use history as a reliable fallback
        data = stock.history(period="1d", interval="1m")
        if data.empty:
            # Fallback for when intraday data isn't available
            data = stock.history(period="2d")
            if data.empty:
                return {"error": "Could not find price data for this ticker."}

        latest_price = data['Close'].iloc[-1]
        previous_close = data['Close'].iloc[-2] if len(data['Close']) > 1 else latest_price
        
        change = latest_price - previous_close
        percent_change = (change / previous_close) * 100

        return {
            "ticker": ticker,
            "price": round(latest_price, 2),
            "change": round(change, 2),
            "percent_change": round(percent_change, 2)
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/")
def read_root():
    return {"message": "Welcome to the StockWise.AI Live Prediction API"}