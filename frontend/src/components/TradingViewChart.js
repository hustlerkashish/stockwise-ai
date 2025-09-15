import React, { useEffect, useRef, memo } from 'react';

// Use React.memo to prevent unnecessary re-renders of the chart
const TradingViewChart = memo(({ symbol }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        // Ensure the container div and the TradingView library are ready
        if (!containerRef.current || !window.TradingView) {
            return;
        }

        const widgetOptions = {
            symbol: `NSE:${symbol}`,
            interval: 'D',
            container: containerRef.current,
            library_path: '/charting_library/',
            locale: 'en',
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: ['study_templates'],
            autosize: true,
            theme: 'Dark', // Match your app's dark theme
        };

        // Create the widget
        const tvWidget = new window.TradingView.widget(widgetOptions);

        // This is the cleanup function. It will be called when the component
        // unmounts or when the `symbol` changes, preventing the error.
        return () => {
            tvWidget.remove();
        };
    }, [symbol]); // The effect re-runs only when the stock symbol changes

    return (
        <div ref={containerRef} className="w-full h-full" />
    );
});

export default TradingViewChart;
