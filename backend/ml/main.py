from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
from datetime import datetime
import os, json, requests, pandas as pd, yfinance as yf
import pandas_ta as ta
from dotenv import load_dotenv

# --- ML model imports ---
from model import load_model, RSI_PERIOD, EMA_SHORT, EMA_LONG

# --- Load env ---
load_dotenv()

app = FastAPI(title="StockWise.AI ML Backend")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Firebase Admin SDK ---
import firebase_admin
from firebase_admin import credentials, firestore, auth

db = None
try:
    cred_path = Path(__file__).resolve().parent / "serviceAccountKey.json"
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"❌ ERROR initializing Firebase Admin SDK: {e}")
    db = None

# --- OAuth2 dependency ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not db:
        raise HTTPException(status_code=500, detail="Firebase is not initialized on the server.")
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {e}")

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

# --- Daily Briefing ---
@app.post("/daily-briefing")
async def get_daily_briefing(request: BriefingRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user['uid']
    watchlist = request.watchlist
    briefing_items = []

    if not watchlist:
        return {"items": []}

    for symbol in watchlist:
        try:
            stock = yf.Ticker(symbol)
            calendar = stock.calendar
            if calendar is not None and isinstance(calendar, pd.DataFrame) and not calendar.empty:
                earnings_date = calendar.iloc[0,0]
                if pd.to_datetime(earnings_date).date() > datetime.now().date() and (pd.to_datetime(earnings_date).date() - datetime.now().date()).days <= 7:
                    briefing_items.append(f"Upcoming Event for {symbol.replace('.NS','')}: Earnings scheduled for {pd.to_datetime(earnings_date).strftime('%B %d, %Y')}.")

            hist = stock.history(period="1mo")
            if not hist.empty and len(hist) > 2:
                avg_volume = hist['Volume'].iloc[-21:-1].mean()
                latest_volume = hist['Volume'].iloc[-1]
                if latest_volume > avg_volume * 2:
                    briefing_items.append(f"Unusual Activity in {symbol.replace('.NS','')}: Today's trading volume is significantly higher than average.")
        except Exception as e:
            print(f"⚠️ Could not fetch briefing data for {symbol}: {e}")
            continue
    return {"items": briefing_items}

# --- Portfolio endpoints ---
@app.get("/portfolio")
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    if not db: raise HTTPException(status_code=500, detail="Firebase not initialized")
    user_id = current_user['uid']
    portfolio_ref = db.collection('portfolios').document(user_id)
    portfolio_doc = portfolio_ref.get()
    if not portfolio_doc.exists:
        portfolio_data = {'cashBalance': 1000000, 'holdings': {}}
        portfolio_ref.set(portfolio_data)
        return portfolio_data
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

# --- Market heatmap ---
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
    tickers_str = " ".join(symbols_to_fetch)
    data = yf.download(tickers=tickers_str, period="2d", group_by='ticker', progress=False)
    for symbol in symbols_to_fetch:
        try:
            info = yf.Ticker(symbol).info
            market_cap = info.get('marketCap', 0)
            hist = data[symbol]
            if hist.empty or len(hist) < 2 or market_cap == 0: continue
            price, prev_close = hist['Close'].iloc[-1], hist['Close'].iloc[-2]
            change_percent = ((price - prev_close) / prev_close) * 100
            heatmap_data.append({'x': symbol.replace('.NS', ''), 'y': market_cap, 'change': round(change_percent, 2)})
        except Exception as e:
            print(f"⚠ Could not fetch heatmap data for {symbol}: {e}")
            continue
    return heatmap_data

# --- Screener ---
@app.post("/screener")
async def run_screener(filters: dict):
    try:
        screener_file = Path(__file__).resolve().parent / "screener_data.json"
        with open(screener_file, 'r') as f: data = json.load(f)
        df = pd.DataFrame(data)
        if filters.get('minMarketCap'): df = df[df['marketCap'] >= int(filters['minMarketCap'])]
        if filters.get('maxPeRatio'): df = df[(df['peRatio'].notna()) & (df['peRatio'] > 0) & (df['peRatio'] <= int(filters['maxPeRatio']))]
        if filters.get('minDividendYield'): df = df[df['dividendYield'] >= float(filters['minDividendYield'])]
        if filters.get('sector'): df = df[df['sector'] == filters['sector']]
        results = df.sort_values(by='marketCap', ascending=False).head(100)
        return json.loads(results.to_json(orient='records'))
    except FileNotFoundError: raise HTTPException(status_code=500, detail="Screener data file not found on server.")
    except Exception as e: raise HTTPException(status_code=500, detail=f"An error occurred in the screener: {str(e)}")

# --- Stock news ---
@app.get("/stock-news")
def get_stock_news(ticker: str):
    if not ticker: raise HTTPException(status_code=400, detail="Ticker symbol is required.")
    NEWS_API_KEY = os.getenv("NEWS_API_KEY")
    if not NEWS_API_KEY: raise HTTPException(status_code=500, detail="NewsAPI key is not configured on the server.")
    try:
        company_name = ticker
        try:
            info = yf.Ticker(f"{ticker}.NS").info
            if 'longName' in info and info['longName']: company_name = info['longName'].replace("Limited", "").replace("Ltd", "").strip()
        except Exception: pass
        domains = "economictimes.indiatimes.com,timesofindia.indiatimes.com,thehindu.com,business-standard.com,livemint.com,moneycontrol.com"
        search_query = f'"{company_name}" OR "{ticker}"'
        url = f"https://newsapi.org/v2/everything?q={search_query}&domains={domains}&sortBy=publishedAt&apiKey={NEWS_API_KEY}&language=en"
        response = requests.get(url); response.raise_for_status()
        articles = response.json().get('articles', [])
        if not articles: raise HTTPException(status_code=404, detail=f"No news found for {ticker} via NewsAPI.")
        formatted_news = []
        for article in articles[:12]:
            if not all(k in article for k in ['title','source','url','publishedAt']) or not article.get('source',{}).get('name'): continue
            try: timestamp = int(datetime.fromisoformat(article['publishedAt'].replace('Z','')).timestamp())
            except (ValueError, TypeError): continue
            formatted_news.append({"uuid": article['url'], "title": article['title'], "publisher": article['source']['name'], "link": article['url'], "providerPublishTime": timestamp, "imageUrl": article.get('urlToImage')})
        return formatted_news
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401: raise HTTPException(status_code=500, detail="NewsAPI key is invalid or unauthorized.")
        raise HTTPException(status_code=503, detail=f"News service failed with status code {e.response.status_code}")
    except Exception as e:
        print(f"⚠️ NewsAPI fetch failed for {ticker}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching news.")

# --- Image proxy ---
@app.get("/image-proxy")
def image_proxy(url: str):
    if not url: raise HTTPException(status_code=400, detail="URL parameter is required.")
    try:
        with requests.Session() as s:
            response = s.get(url, stream=True, headers={'User-Agent': 'Mozilla/5.0'})
            response.raise_for_status()
            return StreamingResponse(response.iter_content(chunk_size=16384), media_type=response.headers.get('Content-Type'))
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Image proxy failed for URL {url}: {e}")
        raise HTTPException(status_code=502, detail="Failed to fetch image from source.")

# --- Search stocks ---
@app.get("/search-stocks")
def search_stocks(query: str):
    if not query or len(query)<1: return []
    url = f"https://query1.finance.yahoo.com/v1/finance/search?q={query}"; headers={'User-Agent':'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers); r.raise_for_status(); data = r.json()
        results = [{"symbol": i.get('symbol'), "name": i.get('longname', i.get('shortname',''))} for i in data.get('quotes',[]) if i.get('exchange') in ['NSI','BSE']]
        return results[:7]
    except requests.exceptions.RequestException as e: raise HTTPException(status_code=503, detail="Failed to connect to search service.")

# --- Batch prices ---
@app.post("/prices/batch")
async def get_batch_prices(data: Tickers):
    results = {}
    for ticker_str in data.tickers:
        try:
            hist = yf.Ticker(ticker_str).history(period="5d", auto_adjust=True)
            if not hist.empty:
                last_two = hist['Close'].tail(2).tolist()
                if len(last_two)==2: prev_close, price = last_two
                else: price=last_two[-1]; prev_close=price
                change=price-prev_close
                percent_change=(change/prev_close*100) if prev_close!=0 else 0
                results[ticker_str]={"price":round(price,2),"change":round(change,2),"percent_change":round(percent_change,2)}
        except Exception as e:
            print(f"⚠ Could not fetch price for {ticker_str}: {e}")
            continue
    return results

# --- Root ---
@app.get("/")
def read_root(): return {"message": "Welcome to the StockWise.AI Prediction API"}
