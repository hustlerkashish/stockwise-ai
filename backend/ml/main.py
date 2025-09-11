from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import yfinance as yf
import pandas_ta as ta
import requests
from .model import load_model, RSI_PERIOD, EMA_SHORT, EMA_LONG
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from dotenv import load_dotenv
from datetime import datetime
import json
import pandas as pd
from pathlib import Path

app = FastAPI(title="StockWise.AI ML Backend")
load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

model = load_model()
class StockData(BaseModel): ticker: str
class Tickers(BaseModel): tickers: List[str]


# --- UPDATED: This function now calculates all 11+ features to match the new model ---
def get_latest_stock_data(ticker: str):
    stock = yf.Ticker(ticker)
    df = stock.history(period="3y", auto_adjust=True) # Use more data for indicator stability
    if df.empty: raise ValueError(f"Could not fetch historical data for '{ticker}'.")
    
    # Calculate all the same features as in your new model.py
    df.ta.rsi(length=RSI_PERIOD, append=True)
    df.ta.ema(length=EMA_SHORT, append=True)
    df.ta.ema(length=EMA_LONG, append=True)
    df.ta.macd(append=True)
    df.ta.bbands(length=20, append=True)
    df.ta.atr(length=14, append=True)
    df.ta.stoch(length=14, append=True)
    df.ta.obv(append=True)
    
    return df.dropna().iloc[-1:]

# --- UPDATED: The /predict endpoint now uses all 11 features ---
@app.post("/predict")
def predict_stock(data: StockData):
    try:
        latest_data = get_latest_stock_data(data.ticker)
        
        # This list of features MUST EXACTLY MATCH the list in your model.py
        feature_names = [
            f'RSI_{RSI_PERIOD}', f'EMA_{EMA_SHORT}', f'EMA_{EMA_LONG}', 'MACD_12_26_9',
            'BBL_20_2.0', 'BBM_20_2.0', 'BBU_20_2.0', 'ATRr_14',
            'STOCHk_14_3_3', 'STOCHd_14_3_3', 'OBV'
        ]

        # Ensure all required columns are present before predicting
        if not all(feature in latest_data.columns for feature in feature_names):
            missing = [f for f in feature_names if f not in latest_data.columns]
            raise ValueError(f"Could not calculate all required indicators. Missing: {missing}")
        
        features_df = latest_data[feature_names]
        
        prediction_raw = model.predict(features_df)
        prediction_proba = model.predict_proba(features_df)
        prob_down, prob_up = prediction_proba[0][0], prediction_proba[0][1]

        if prediction_raw[0] == 1 and prob_up > 0.55: recommendation = "Buy"
        elif prediction_raw[0] == 0 and prob_down > 0.55: recommendation = "Sell"
        else: recommendation = "Hold"
        
        confidence = max(prob_up, prob_down) * 100
        
        return {
            "ticker": data.ticker,
            "recommendation": recommendation,
            "confidence_score": f"{confidence:.2f}%"
        }
    except Exception as e:
        print(f"⚠️ Prediction failed for {data.ticker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# --- (The rest of your endpoints remain unchanged) ---

INDEX_SYMBOLS = {
    "NIFTY 50": [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS", "HINDUNILVR.NS",
        "BHARTIARTL.NS", "ITC.NS", "SBIN.NS", "LICI.NS", "HCLTECH.NS", "LT.NS",
        "BAJFINANCE.NS", "KOTAKBANK.NS", "ADANIENT.NS", "ASIANPAINT.NS", "AXISBANK.NS",
        "MARUTI.NS", "SUNPHARMA.NS", "WIPRO.NS", "TATAMOTORS.NS", "NTPC.NS", "ULTRACEMCO.NS",
        "ADANIPORTS.NS", "BAJAJFINSV.NS", "POWERGRID.NS", "COALINDIA.NS", "NESTLEIND.NS",
        "ONGC.NS", "TATASTEEL.NS", "JSWSTEEL.NS", "M&M.NS", "HDFCLIFE.NS", "SBILIFE.NS",
        "GRASIM.NS", "HINDALCO.NS", "INDUSINDBK.NS", "TECHM.NS", "CIPLA.NS", "DRREDDY.NS",
        "BRITANNIA.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS", "APOLLOHOSP.NS", "TITAN.NS",
        "TATACONSUM.NS", "HEROMOTOCO.NS", "UPL.NS", "DIVISLAB.NS", "BPCL.NS"
    ],
    "NIFTY BANK": [
        "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS", 
        "INDUSINDBK.NS", "BANKBARODA.NS", "PNB.NS", "AUBANK.NS", "FEDERALBNK.NS", 
        "IDFCFIRSTB.NS", "BANDHANBNK.NS"
    ]
}

@app.get("/market-heatmap")
async def get_market_heatmap_data(index: Optional[str] = "NIFTY 50"):
    symbols_to_fetch = INDEX_SYMBOLS.get(index)
    if not symbols_to_fetch:
        raise HTTPException(status_code=404, detail="Index not found.")
    
    heatmap_data = []
    print(f"Fetching data for {index} heatmap...")
    tickers_str = " ".join(symbols_to_fetch)
    data = yf.download(tickers=tickers_str, period="2d", group_by='ticker', progress=False)

    for symbol in symbols_to_fetch:
        try:
            info = yf.Ticker(symbol).info
            market_cap = info.get('marketCap', 0)
            
            hist = data[symbol]
            if hist.empty or len(hist) < 2 or market_cap == 0:
                continue

            price = hist['Close'].iloc[-1]
            prev_close = hist['Close'].iloc[-2]
            change_percent = ((price - prev_close) / prev_close) * 100
            
            heatmap_data.append({
                'x': symbol.replace('.NS', ''),
                'y': market_cap,
                'change': round(change_percent, 2)
            })
        except Exception as e:
            print(f"⚠️ Could not fetch heatmap data for {symbol}: {e}")
            continue
            
    return heatmap_data

@app.post("/screener")
async def run_screener(filters: dict):
    try:
        screener_file = Path(__file__).resolve().parent / "screener_data.json"
        with open(screener_file, 'r') as f:
            data = json.load(f)
        df = pd.DataFrame(data)
        if filters.get('minMarketCap'):
            df = df[df['marketCap'] >= int(filters['minMarketCap'])]
        if filters.get('maxPeRatio'):
            df = df[(df['peRatio'].notna()) & (df['peRatio'] > 0) & (df['peRatio'] <= int(filters['maxPeRatio']))]
        if filters.get('minDividendYield'):
            df = df[df['dividendYield'] >= float(filters['minDividendYield'])]
        if filters.get('sector'):
            df = df[df['sector'] == filters['sector']]
        results = df.sort_values(by='marketCap', ascending=False).head(100)
        return json.loads(results.to_json(orient='records'))
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Screener data file not found on server.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred in the screener: {str(e)}")

@app.get("/stock-news")
def get_stock_news(ticker: str):
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker symbol is required.")
    try:
        stock = yf.Ticker(f"{ticker}.NS")
        news_results = stock.news
        if news_results:
            cleaned_news = [article for article in news_results if all(k in article for k in ['title', 'publisher', 'link', 'providerPublishTime'])]
            if cleaned_news:
                print(f"✅ Found news for {ticker} via yfinance.")
                return cleaned_news[:8]
    except Exception as e:
        print(f"⚠️ yfinance news failed for {ticker}: {e}. Proceeding to fallback.")

    print(f"-> yfinance found no news for {ticker}. Using smarter NewsAPI fallback...")
    NEWS_API_KEY = os.getenv("NEWS_API_KEY")
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="NewsAPI key is not configured.")
    try:
        company_name = ticker
        try:
            info = yf.Ticker(f"{ticker}.NS").info
            if 'longName' in info and info['longName']:
                company_name = info['longName'].replace("Limited", "").replace("Ltd", "").strip()
        except Exception:
            pass
        domains = "economictimes.indiatimes.com,timesofindia.indiatimes.com,thehindu.com,business-standard.com,livemint.com,moneycontrol.com"
        search_query = f'"{company_name}" OR "{ticker}"'
        url = f"https://newsapi.org/v2/everything?q={search_query}&domains={domains}&sortBy=publishedAt&apiKey={NEWS_API_KEY}&language=en"
        response = requests.get(url)
        response.raise_for_status()
        articles = response.json().get('articles', [])
        formatted_news = []
        for article in articles:
            if not all(k in article for k in ['title', 'source', 'url', 'publishedAt']) or not article.get('source', {}).get('name'):
                continue
            published_at_str = article.get('publishedAt')
            if not published_at_str: continue
            try:
                timestamp = int(datetime.fromisoformat(published_at_str.replace('Z', '')).timestamp())
                formatted_news.append({
                    "uuid": article['url'], "title": article['title'],
                    "publisher": article['source']['name'], "link": article['url'],
                    "providerPublishTime": timestamp
                })
            except (ValueError, TypeError):
                continue
        if not formatted_news:
            raise HTTPException(status_code=404, detail=f"No news found for {ticker} via fallback.")
        return formatted_news[:8]
    except Exception as e:
        print(f"⚠️ NewsAPI fallback failed for {ticker}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching news.")

@app.get("/search-stocks")
def search_stocks(query: str):
    if not query or len(query) < 1: return []
    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}"; headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers); r.raise_for_status(); data = r.json()
        results = [{"symbol": i.get('symbol'), "name": i.get('longname', i.get('shortname', ''))} for i in data.get('quotes', []) if i.get('exchange') in ['NSI', 'BSE']]
        return results[:7]
    except requests.exceptions.RequestException as e: raise HTTPException(status_code=503, detail="Failed to connect to search service.")

@app.post("/prices/batch")
async def get_batch_prices(data: Tickers):
    results = {};
    for ticker_str in data.tickers:
        try:
            stock = yf.Ticker(ticker_str); hist = stock.history(period="2d", auto_adjust=True)
            hist = hist.dropna()
            if not hist.empty and len(hist) > 1:
                price, prev_close = hist['Close'].iloc[-1], hist['Close'].iloc[-2]
                change = price - prev_close; percent_change = (change / prev_close) * 100 if prev_close != 0 else 0
                results[ticker_str] = {"price": round(price, 2), "change": round(change, 2), "percent_change": round(percent_change, 2)}
        except Exception as e:
            print(f"⚠️ Could not fetch price for {ticker_str}: {e}"); continue
    return results

@app.get("/")
def read_root(): return {"message": "Welcome to the StockWise.AI Prediction API"}