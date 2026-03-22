from rest_framework import serializers
from .models import StockCategory, Stock, StockPrice, StockPrediction


class StockCategorySerializer(serializers.ModelSerializer):
    """Serializer for stock categories."""
    stock_count = serializers.SerializerMethodField()
    
    class Meta:
        model = StockCategory
        fields = ['id', 'name', 'description', 'created_at', 'stock_count']
    
    def get_stock_count(self, obj):
        return obj.stocks.filter(is_active=True).count()


class StockSerializer(serializers.ModelSerializer):
    """Serializer for stocks."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    latest_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = [
            'id', 'symbol', 'name', 'category', 'category_name',
            'exchange', 'currency', 'sector', 'industry', 
            'market_cap', 'is_active', 'latest_price', 
            'created_at', 'updated_at'
        ]
    
    def get_latest_price(self, obj):
        latest_price = obj.prices.first()
        if latest_price:
            return {
                'date': latest_price.date,
                'close_price': float(latest_price.close_price),
                'volume': latest_price.volume
            }
        return None


class StockPriceSerializer(serializers.ModelSerializer):
    """Serializer for stock prices."""
    stock_symbol = serializers.CharField(source='stock.symbol', read_only=True)
    
    class Meta:
        model = StockPrice
        fields = [
            'id', 'stock', 'stock_symbol', 'date', 
            'open_price', 'high_price', 'low_price', 
            'close_price', 'volume', 'adj_close'
        ]


class StockDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for stock with price history."""
    category = StockCategorySerializer(read_only=True)
    price_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = [
            'id', 'symbol', 'name', 'category', 'exchange', 
            'currency', 'sector', 'industry', 'market_cap',
            'price_history', 'created_at', 'updated_at'
        ]
    
    def get_price_history(self, obj):
        # Get last 30 days of price data
        prices = obj.prices.all()[:30]
        return StockPriceSerializer(prices, many=True).data

class StockPredictionSerializer(serializers.ModelSerializer):
    """Serializer for stock predictions."""
    class Meta:
        model = StockPrediction
        fields = [
            'id', 'symbol', 'target_time', 'current_price', 
            'min_price_30d', 'max_price_30d', 'arima_prediction', 
            'lstm_prediction', 'cnn_prediction', 'actual_price', 
            'arima_error', 'lstm_error', 'cnn_error', 'created_at'
        ]