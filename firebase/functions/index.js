const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * A sample Cloud Function to send a notification (in-app or push)
 * when a 'SELL' recommendation is made for a stock in a user's watchlist.
 *
 * This function would be triggered by the n8n workflow after a prediction is made.
 */
exports.notifyUserOnSellAlert = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const stockTicker = data.ticker; // e.g., 'RELIANCE.NS'

  // Log the alert to Firestore for the user's records
  await admin.firestore().collection("users").doc(userId).collection("alerts").add({
    ticker: stockTicker,
    recommendation: "SELL",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    message: `A 'SELL' signal was predicted for ${stockTicker}. You may want to review your position.`,
  });

  // Here, you would add code to send a Push Notification via Firebase Cloud Messaging (FCM)
  // or create an in-app notification.

  return {
    status: "success",
    message: `Alert for ${stockTicker} has been logged for user ${userId}.`,
  };
});