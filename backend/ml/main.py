from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os, json, requests, pandas as pd, yfinance as yf
import pandas_ta as ta
from dotenv import load_dotenv
import time, random

# --- ML model imports ---
from model import load_model, RSI_PERIOD, EMA_SHORT, EMA_LONG

# --- Load environment variables ---
load_dotenv()

app = FastAPI(title="StockWise.AI ML Backend")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update for frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Firebase Admin SDK ---
import firebase_admin
from firebase_admin import credentials, firestore, auth

db = None
try:
    firebase_service_account = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if not firebase_admin._apps:
        if not firebase_service_account:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT environment variable not set.")
        cred_dict = json.loads(firebase_service_account)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase initialized successfully via Render secret.")
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    db = None

# --- OAuth2 ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not initialized.")
    try:
        return auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid credentials: {e}")

# --- Load ML model ---
model = load_model()

# --- Pydantic models ---
class StockData(BaseModel):
    ticker: str

class Tickers(BaseModel):
    tickers: List[str]

class TradeOrder(BaseModel):
    symbol: str
    quantity: int
    price: float

class BriefingRequest(BaseModel):
    watchlist: List[str]

# --- Helper: Fetch Yahoo Finance history with exponential backoff ---
def fetch_yf_history(ticker, period="5d", retries=5):
    for attempt in range(retries):
        try:
            df = yf.Ticker(ticker).history(period=period, auto_adjust=True)
            if not df.empty:
                return df
        except Exception as e:
            wait = (2 ** attempt) + random.uniform(0, 1)
            print(f"Attempt {attempt+1} failed for {ticker}: {e}. Retrying in {wait:.1f}s...")
            time.sleep(wait)
    print(f"❌ Failed to fetch {ticker} after {retries} attempts")
    return None

# --- Daily Briefing ---
@app.post("/daily-briefing")
async def get_daily_briefing(request: BriefingRequest, current_user: dict = Depends(get_current_user)):
    briefing_items = []
    chunk_size = 5
    watchlist = request.watchlist

    for i in range(0, len(watchlist), chunk_size):
        chunk = watchlist[i:i+chunk_size]
        for symbol in chunk:
            hist = fetch_yf_history(symbol, period="1mo")
            if hist is None or hist.empty: 
                continue

            # Earnings events
            try:
                cal = yf.Ticker(symbol).calendar
                if cal is not None and not cal.empty:
                    earnings_date = cal.iloc[0,0]
                    if pd.to_datetime(earnings_date).date() > datetime.now().date() and \
                       (pd.to_datetime(earnings_date).date() - datetime.now().date()).days <= 7:
                        briefing_items.append(
                            f"Upcoming Event: {symbol.replace('.NS','')} Earnings on {pd.to_datetime(earnings_date).strftime('%B %d, %Y')}."
                        )
            except Exception as e:
                print(f"⚠ Error fetching calendar for {symbol}: {e}")

            # Unusual volume detection
            if len(hist) > 2:
                avg_vol = hist['Volume'].iloc[-21:-1].mean()
                latest_vol = hist['Volume'].iloc[-1]
                if latest_vol > avg_vol * 2:
                    briefing_items.append(
                        f"Unusual Activity: {symbol.replace('.NS','')} trading volume is unusually high today."
                    )

        time.sleep(1)

    return {"items": briefing_items}

# --- Portfolio endpoints ---
@app.get("/portfolio")
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    if not db: raise HTTPException(status_code=500, detail="Firebase not initialized")
    user_id = current_user['uid']
    portfolio_ref = db.collection('portfolios').document(user_id)
    portfolio_doc = portfolio_ref.get()
    if not portfolio_doc.exists:
        data = {'cashBalance': 1000000, 'holdings': {}}
        portfolio_ref.set(data)
        return data
    return portfolio_doc.to_dict()

@app.post("/portfolio/buy")
def buy_stock(order: TradeOrder, current_user: dict = Depends(get_current_user)):
    if not db: raise HTTPException(status_code=500, detail="Firebase not initialized")
    user_id = current_user['uid']
    portfolio_ref = db.collection('portfolios').document(user_id)

    @firestore.transactional
    def update_in_transaction(transaction, portfolio_ref, order):
        snapshot = portfolio_ref.get(transaction=transaction)
        if not snapshot.exists:
            portfolio_ref.set({'cashBalance': 1000000, 'holdings': {}}, transaction=transaction)
            snapshot = portfolio_ref.get(transaction=transaction)
        portfolio_data = snapshot.to_dict()
        cost = order.quantity * order.price
        if portfolio_data.get('cashBalance', 0) < cost:
            raise ValueError("Insufficient funds.")
        new_cash = portfolio_data['cashBalance'] - cost
        holdings = portfolio_data.get('holdings', {})
        if order.symbol in holdings:
            old_qty = holdings[order.symbol]['quantity']
            old_avg = holdings[order.symbol]['averagePrice']
            new_qty = old_qty + order.quantity
            new_avg = ((old_qty * old_avg) + cost) / new_qty
            holdings[order.symbol].update({'quantity': new_qty, 'averagePrice': new_avg})
        else:
            holdings[order.symbol] = {'quantity': order.quantity, 'averagePrice': order.price}
        transaction.update(portfolio_ref, {'cashBalance': new_cash, 'holdings': holdings})
        return new_cash

    try:
        transaction = db.transaction()
        new_cash_balance = update_in_transaction(transaction, portfolio_ref, order)
        return {"message": "Purchase successful", "newCashBalance": new_cash_balance}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

@app.post("/portfolio/sell")
def sell_stock(order: TradeOrder, current_user: dict = Depends(get_current_user)):
    if not db: raise HTTPException(status_code=500, detail="Firebase not initialized")
    user_id = current_user['uid']
    portfolio_ref = db.collection('portfolios').document(user_id)

    @firestore.transactional
    def update_in_transaction(transaction, portfolio_ref, order):
        snapshot = portfolio_ref.get(transaction=transaction)
        if not snapshot.exists: raise ValueError("Portfolio not found.")
        portfolio_data = snapshot.to_dict()
        holdings = portfolio_data.get('holdings', {})
        if order.symbol not in holdings or holdings[order.symbol]['quantity'] < order.quantity:
            raise ValueError("Not enough shares to sell.")
        revenue = order.quantity * order.price
        new_cash = portfolio_data['cashBalance'] + revenue
        holdings[order.symbol]['quantity'] -= order.quantity
        if holdings[order.symbol]['quantity'] == 0:
            del holdings[order.symbol]
        transaction.update(portfolio_ref, {'cashBalance': new_cash, 'holdings': holdings})
        return new_cash

    try:
        transaction = db.transaction()
        new_cash_balance = update_in_transaction(transaction, portfolio_ref, order)
        return {"message": "Sale successful", "newCashBalance": new_cash_balance}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

# --- Prediction endpoint ---
def get_latest_stock_data(ticker: str):
    stock = yf.Ticker(ticker)
    df = stock.history(period="3y", auto_adjust=True)
    if df.empty: raise ValueError(f"Could not fetch historical data for '{ticker}'.")
    df.ta.rsi(length=14, append=True)
    df.ta.ema(length=50, append=True)
    df.ta.ema(length=200, append=True)
    df.ta.macd(append=True)
    df.ta.bbands(length=20, append=True)
    df.ta.atr(length=14, append=True)
    df.ta.stoch(length=14, append=True)
    df.ta.obv(append=True)
    return df.dropna().iloc[-1:]

@app.post("/predict")
def predict_stock(data: StockData):
    try:
        latest_data = get_latest_stock_data(data.ticker)
        feature_names = [
            f'RSI_{RSI_PERIOD}', f'EMA_{EMA_SHORT}', f'EMA_{EMA_LONG}', 'MACD_12_26_9',
            'BBL_20_2.0', 'BBM_20_2.0', 'BBU_20_2.0', 'ATRr_14',
            'STOCHk_14_3_3', 'STOCHd_14_3_3', 'OBV'
        ]
        missing = [f for f in feature_names if f not in latest_data.columns]
        if missing:
            raise ValueError(f"Missing indicators: {missing}")
        features_df = latest_data[feature_names]
        prediction_raw = model.predict(features_df)
        prediction_proba = model.predict_proba(features_df)
        prob_down, prob_up = prediction_proba[0][0], prediction_proba[0][1]
        if prediction_raw[0] == 1 and prob_up > 0.55: recommendation = "Buy"
        elif prediction_raw[0] == 0 and prob_down > 0.55: recommendation = "Sell"
        else: recommendation = "Hold"
        confidence = max(prob_up, prob_down) * 100
        return {"ticker": data.ticker, "recommendation": recommendation, "confidence_score": f"{confidence:.2f}%"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Market heatmap endpoint ---
INDEX_SYMBOLS = {
    "NIFTY 50": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS"],
    "NIFTY BANK": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS"]
}

@app.get("/market-heatmap")
async def get_market_heatmap_data(index: Optional[str] = "NIFTY 50"):
    symbols_to_fetch = INDEX_SYMBOLS.get(index)
    if not symbols_to_fetch:
        raise HTTPException(status_code=404, detail="Index not found.")
    heatmap_data = []
    try:
        data = yf.download(" ".join(symbols_to_fetch), period="2d", group_by='ticker', progress=False)
        for symbol in symbols_to_fetch:
            try:
                info = yf.Ticker(symbol).info
                market_cap = info.get('marketCap', 0)
                hist = data[symbol]
                if hist.empty or len(hist) < 2 or market_cap == 0: continue
                price, prev_close = hist['Close'].iloc[-1], hist['Close'].iloc[-2]
                change_percent = ((price - prev_close) / prev_close) * 100
                heatmap_data.append({'x': symbol.replace('.NS', ''), 'y': market_cap, 'change': round(change_percent, 2)})
            except: continue
    except Exception as e:
        print(f"Heatmap fetch error: {e}")
    return heatmap_data

# --- Stock news endpoint ---
@app.get("/stock-news")
def get_stock_news(ticker: str):
    if not ticker: raise HTTPException(status_code=400, detail="Ticker required.")
    NEWS_API_KEY = os.getenv("NEWS_API_KEY")
    if not NEWS_API_KEY: raise HTTPException(status_code=500, detail="NewsAPI key missing.")
    try:
        company_name = ticker
        try:
            info = yf.Ticker(f"{ticker}.NS").info
            company_name = info.get('longName', ticker).replace("Limited","").replace("Ltd","").strip()
        except: pass
        domains = "economictimes.indiatimes.com,timesofindia.indiatimes.com,thehindu.com,business-standard.com,livemint.com,moneycontrol.com"
        url = f"https://newsapi.org/v2/everything?q=\"{company_name}\" OR \"{ticker}\"&domains={domains}&sortBy=publishedAt&apiKey={NEWS_API_KEY}&language=en"
        response = requests.get(url); response.raise_for_status()
        articles = response.json().get('articles', [])
        formatted_news = []
        for article in articles[:12]:
            if not all(k in article for k in ['title','source','url','publishedAt']): continue
            try: timestamp = int(datetime.fromisoformat(article['publishedAt'].replace('Z','')).timestamp())
            except: continue
            formatted_news.append({
                "uuid": article['url'], "title": article['title'], 
                "publisher": article['source']['name'], "link": article['url'], 
                "providerPublishTime": timestamp, "imageUrl": article.get('urlToImage')
            })
        return formatted_news
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401: raise HTTPException(status_code=500, detail="NewsAPI key invalid.")
        raise HTTPException(status_code=503, detail=f"News service failed: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal error while fetching news.")

# --- Search stocks endpoint ---
@app.get("/search-stocks")
def search_stocks(query: str):
    if not query or len(query)<1: return []
    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}"
    headers={'User-Agent':'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers); r.raise_for_status(); data = r.json()
        results = [{"symbol": i.get('symbol'), "name": i.get('longname', i.get('shortname',''))} 
                   for i in data.get('quotes',[]) if i.get('exchange') in ['NSI','BSE']]
        return results[:7]
    except Exception as e: raise HTTPException(status_code=503, detail="Search service unavailable.")

# --- Batch prices endpoint ---
@app.post("/prices/batch")
async def get_batch_prices(data: Tickers):
    results = {}
    tickers = data.tickers
    chunk_size = 5

    for i in range(0, len(tickers), chunk_size):
        chunk = tickers[i:i+chunk_size]
        tickers_str = " ".join(chunk)

        # Batch download first
        try:
            yf_data = yf.download(tickers=tickers_str, period="5d", group_by='ticker', progress=False)
        except Exception as e:
            print(f"Batch download failed for {chunk}: {e}")
            yf_data = None

        for ticker in chunk:
            try:
                if yf_data is not None and ticker in getattr(yf_data.columns, 'levels', [[]])[0]:
                    hist = yf_data[ticker]['Close'].tail(2)
                    prev_close, price = hist.tolist() if len(hist)==2 else (hist.iloc[-1], hist.iloc[-1])
                else:
                    hist = fetch_yf_history(ticker)
                    if hist is None or hist.empty: 
                        results[ticker] = {"price": None, "change": None, "percent_change": None}
                        continue
                    last_two = hist['Close'].tail(2).tolist()
                    prev_close, price = last_two if len(last_two)==2 else (last_two[-1], last_two[-1])

                change = price - prev_close
                percent_change = (change / prev_close * 100) if prev_close != 0 else 0
                results[ticker] = {"price": round(price,2), "change": round(change,2), "percent_change": round(percent_change,2)}
            except Exception as e:
                print(f"⚠ Failed to process {ticker}: {e}")
                results[ticker] = {"price": None, "change": None, "percent_change": None}

        time.sleep(1)

    return results

# --- Root endpoint ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the StockWise.AI Prediction API"}
