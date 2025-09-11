import pandas as pd
import yfinance as yf
import pandas_ta as ta
from xgboost import XGBClassifier
import joblib
from pathlib import Path

# --- Configuration ---
BASE_DIR = Path(__file__).resolve().parent
MODEL_FILE_PATH = BASE_DIR / "stock_predictor.joblib"

# A more diverse list of NIFTY 50 and other large-cap stocks for a more robust model
STOCKS_TO_TRAIN = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "HINDUNILVR.NS", "SBIN.NS", "BAJFINANCE.NS", "BHARTIARTL.NS", "ITC.NS",
    "KOTAKBANK.NS", "LT.NS", "HCLTECH.NS", "AXISBANK.NS", "ASIANPAINT.NS",
    "MARUTI.NS", "TATAMOTORS.NS", "SUNPHARMA.NS", "ADANIENT.NS", "JSWSTEEL.NS"
]
DATA_PERIOD = "7y" # Using 7 years of data to capture more market cycles
RSI_PERIOD = 14
EMA_SHORT = 50
EMA_LONG = 200

def create_features(df):
    """
    Calculates a rich set of technical indicators for the model.
    This is the "brain" of the prediction system.
    """
    df = df.copy()
    
    # --- Momentum Indicators ---
    df.ta.rsi(length=RSI_PERIOD, append=True)
    df.ta.macd(append=True)
    df.ta.stoch(length=14, append=True) # Stochastic Oscillator
    
    # --- Volatility Indicators ---
    df.ta.bbands(length=20, append=True) # Bollinger Bands
    df.ta.atr(length=14, append=True)    # Average True Range

    # --- Trend Indicators ---
    df.ta.ema(length=EMA_SHORT, append=True)
    df.ta.ema(length=EMA_LONG, append=True)

    # --- Volume Indicators ---
    df.ta.obv(append=True) # On-Balance Volume
    
    # Drop rows with NaN values created by the indicators
    df = df.dropna()
    return df

def create_target(df):
    """Creates the target variable: 1 if the next day's price went up, 0 otherwise."""
    df = df.copy()
    df['target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    return df

def train_new_model():
    """Fetches data, engineers features, and trains a new XGBoost model."""
    print("--- Starting New Model Training with Enhanced Features ---")
    all_stocks_df = pd.DataFrame()

    print(f"Fetching {DATA_PERIOD} of data for {len(STOCKS_TO_TRAIN)} stocks...")
    for ticker in STOCKS_TO_TRAIN:
        try:
            stock_df = yf.download(ticker, period=DATA_PERIOD, progress=False, auto_adjust=True)

            # --- FIX: Handle the MultiIndex column issue from yfinance ---
            if isinstance(stock_df.columns, pd.MultiIndex):
                stock_df.columns = stock_df.columns.get_level_values(0)

            if stock_df.empty or len(stock_df) < EMA_LONG:
                print(f"⏭️ Not enough data for {ticker}. Skipping...")
                continue

            stock_df = create_features(stock_df)
            stock_df = create_target(stock_df)
            stock_df.dropna(subset=['target'], inplace=True)
            
            all_stocks_df = pd.concat([all_stocks_df, stock_df], ignore_index=True)
            print(f"✅ Processed {ticker}")

        except Exception as e:
            print(f"⚠️ Failed to process {ticker}: {e}")

    if all_stocks_df.empty:
        print("❌ No data was successfully processed. Aborting model training.")
        return

    # --- NEW: Updated list of all features for the model to learn from ---
    feature_names = [
        f'RSI_{RSI_PERIOD}', f'EMA_{EMA_SHORT}', f'EMA_{EMA_LONG}', 'MACD_12_26_9',
        'BBL_20_2.0', 'BBM_20_2.0', 'BBU_20_2.0', 'ATRr_14',
        'STOCHk_14_3_3', 'STOCHd_14_3_3', 'OBV'
    ]

    try:
        X = all_stocks_df[feature_names]
        y = all_stocks_df['target']
    except KeyError as ke:
        print(f"❌ A feature column is missing: {ke}. This can happen if a stock has unusual data.")
        return

    print(f"\n✅ Training on a final dataset of {len(X)} rows with {len(feature_names)} features.")
    
    # Initialize and train the XGBoost model
    model = XGBClassifier(
        use_label_encoder=False, 
        eval_metric='logloss', 
        random_state=42,
        n_estimators=150, # More estimators can help learn complex patterns
        learning_rate=0.1,
        max_depth=5
    )
    model.fit(X, y)

    print(f"\n💾 Saving new, smarter model to: {MODEL_FILE_PATH}")
    joblib.dump(model, MODEL_FILE_PATH)
    print("✅ Model training complete and saved!")

def load_model():
    """Loads the pre-trained model, or trains a new one if it doesn't exist."""
    if not MODEL_FILE_PATH.exists():
        print("⚠️ Model file not found. Training a new model. This may take a few minutes...")
        train_new_model()
    
    print(f"🧠 Loading model from {MODEL_FILE_PATH}")
    return joblib.load(MODEL_FILE_PATH)

if __name__ == '__main__':
    train_new_model()

