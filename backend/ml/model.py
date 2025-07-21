import pandas as pd
import yfinance as yf
import pandas_ta as ta
from xgboost import XGBClassifier
import joblib
from pathlib import Path

# --- Configuration ---
BASE_DIR = Path(__file__).resolve().parent
MODEL_FILE_PATH = BASE_DIR / "stock_predictor.joblib"

STOCKS_TO_TRAIN = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "SBIN.NS", "BAJFINANCE.NS", "BHARTIARTL.NS", "ITC.NS"
]
DATA_PERIOD = "5y"
RSI_PERIOD = 14
MA_SHORT = 50
MA_LONG = 200


def create_features(df):
    df = df.copy()
    df.ta.rsi(length=RSI_PERIOD, append=True)
    df.ta.ema(length=MA_SHORT, append=True)
    df.ta.ema(length=MA_LONG, append=True)
    df.ta.macd(append=True)
    df = df.dropna()  # Drop rows with NaNs due to indicators
    return df


def create_target(df):
    df = df.copy()
    price_col = "Close"

    if price_col not in df.columns:
        if "Adj Close" in df.columns:
            price_col = "Adj Close"
        else:
            raise ValueError("No valid close price column found.")

    df['target'] = (df[price_col].shift(-1) > df[price_col]).astype(int)
    return df


def train_new_model():
    print("--- Starting New Model Training ---")
    all_stocks_df = pd.DataFrame()

    print(f"Fetching {DATA_PERIOD} of data for {len(STOCKS_TO_TRAIN)} stocks...")

    for ticker in STOCKS_TO_TRAIN:
        try:
            stock_df = yf.download(ticker, period=DATA_PERIOD, progress=False, auto_adjust=False)

            # 🛠️ Flatten MultiIndex columns
            if isinstance(stock_df.columns, pd.MultiIndex):
                stock_df.columns = stock_df.columns.get_level_values(0)

            print(f"{ticker} columns: {stock_df.columns.tolist()}")

            if stock_df.empty or len(stock_df) < 200:
                print(f"⏭️ Not enough data for {ticker}. Skipping...")
                continue

            stock_df['Ticker'] = ticker
            stock_df = create_features(stock_df)
            stock_df = create_target(stock_df)
            stock_df.dropna(subset=['target'], inplace=True)
            stock_df['target'] = stock_df['target'].astype(int)

            all_stocks_df = pd.concat([all_stocks_df, stock_df], ignore_index=True)

        except Exception as e:
            print(f"⚠️ Failed to process {ticker}: {e}")

    if all_stocks_df.empty:
        print("❌ No data fetched or feature extraction failed. Aborting.")
        return

    feature_names = [
        f'RSI_{RSI_PERIOD}',
        f'EMA_{MA_SHORT}',
        f'EMA_{MA_LONG}',
        'MACD_12_26_9'
    ]

    try:
        X = all_stocks_df[feature_names]
        y = all_stocks_df['target']
    except KeyError as ke:
        print(f"❌ Missing expected feature columns: {ke}")
        return

    print(f"✅ Training on {len(X)} rows with {len(feature_names)} features.")
    model = XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    model.fit(X, y)

    print(f"💾 Saving model to: {MODEL_FILE_PATH}")
    joblib.dump(model, MODEL_FILE_PATH)
    print("✅ Model training complete and saved!")


def load_model():
    if not MODEL_FILE_PATH.exists():
        print("⚠️ Model not found. Training a new one...")
        train_new_model()
    return joblib.load(MODEL_FILE_PATH)


if __name__ == '__main__':
    train_new_model()
