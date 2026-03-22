import os
import django
import sys
from django.utils import timezone
from datetime import timedelta

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stock_api.settings")
django.setup()

from stocks.models import StockPrediction

# Create a prediction with a past target time
obj = StockPrediction.objects.create(
    symbol="MSFT",
    target_time=timezone.now() - timedelta(hours=1),
    current_price=400.0,
    min_price_30d=380.0,
    max_price_30d=420.0,
    arima_prediction=405.0,
    lstm_prediction=402.0,
    cnn_prediction=406.0
)
print("Created past prediction, ID:", obj.id)
