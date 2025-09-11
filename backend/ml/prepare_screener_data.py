# /backend/ml/prepare_screener_data.py
import yfinance as yf
import pandas as pd
import json
from pathlib import Path
import time

BASE_DIR = Path(__file__).resolve().parent
INPUT_CSV_PATH = BASE_DIR / "nse_stocks.csv" 
OUTPUT_JSON_PATH = BASE_DIR / "screener_data.json"

def gather_data():
    try:
        all_symbols_df = pd.read_csv(INPUT_CSV_PATH)
        symbols = all_symbols_df['SYMBOL'].tolist()
        print(f"✅ Found {len(symbols)} symbols to process.")
    except FileNotFoundError:
        print(f"❌ ERROR: nse_stocks.csv not found in /backend/ml/. Please complete Step 1.A first.")
        return

    all_stock_data = []
    total_symbols = len(symbols)
    start_time = time.time()

    for i, symbol in enumerate(symbols):
        # We only want to process main equity stocks, not debentures or weird tickers
        if '-' in symbol or len(symbol) > 12:
            print(f"-> Skipping invalid-looking symbol: {symbol}")
            continue
            
        ticker_str = f"{symbol}.NS"
        print(f"Processing ({i+1}/{total_symbols}): {ticker_str}...")
        
        try:
            stock = yf.Ticker(ticker_str)
            info = stock.info

            market_cap = info.get('marketCap', 0)
            price = info.get('currentPrice', info.get('regularMarketPrice', 0))

            # Skip stocks with no market cap or price data
            if not market_cap or not price:
                print(f" -> Skipping {ticker_str} (missing critical data).")
                continue

            all_stock_data.append({
                'symbol': symbol,
                'price': price,
                'marketCap': market_cap,
                'peRatio': info.get('trailingPE'),
                'pbRatio': info.get('priceToBook'),
                'dividendYield': round(info.get('dividendYield', 0) * 100, 2),
                'sector': info.get('sector', 'N/A'),
            })
            # Add a small delay to be respectful to the data provider's servers
            time.sleep(0.2) 

        except Exception as e:
            # yfinance often throws errors for delisted or obscure tickers, which is normal.
            print(f" -> ERROR processing {ticker_str}. Skipping.")
            continue

    end_time = time.time()
    print(f"\n✅ Successfully processed {len(all_stock_data)} stocks in {((end_time - start_time) / 60):.2f} minutes.")
    
    with open(OUTPUT_JSON_PATH, 'w') as f:
        json.dump(all_stock_data, f)
        
    print(f"✅ Data saved to screener_data.json!")

if __name__ == '__main__':
    gather_data()