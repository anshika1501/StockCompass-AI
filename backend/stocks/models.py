from django.db import models
from django.utils import timezone
from pgvector.django import VectorField
from django.contrib.auth import get_user_model

User = get_user_model()

class Portfolio(models.Model):
    """User-specific portfolio to group stock holdings."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolios')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class UserSecurityProfile(models.Model):
    """Security metadata for a user account."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='security_profile')
    mpin_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['user_id']

    def __str__(self):
        return f"Security profile for {self.user.username}"

class Holding(models.Model):
    """A stock holding within a user's portfolio."""
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='holdings')
    ticker = models.CharField(max_length=20)
    company_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    buy_price = models.FloatField()
    buy_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-buy_time']

    def __str__(self):
        return f"{self.quantity} shares of {self.ticker} in {self.portfolio.name}"


class StockCategory(models.Model):
    """Model for stock categories like IT, Banking, etc."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, default='trending-up')
    image = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Stock Categories"
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Stock(models.Model):
    """Model for individual stocks."""
    symbol = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(
        StockCategory, 
        on_delete=models.CASCADE,
        related_name='stocks'
    )
    exchange = models.CharField(max_length=50, blank=True, null=True)
    currency = models.CharField(max_length=10, default='USD')
    sector = models.CharField(max_length=100, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    market_cap = models.BigIntegerField(blank=True, null=True)
    current_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    previous_close = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fifty_two_week_high = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fifty_two_week_low = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pe_ratio = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    description = models.TextField(blank=True, default='')
    website = models.URLField(max_length=500, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    employees = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['symbol']
    
    def __str__(self):
        return f"{self.symbol} - {self.name}"


class StockPrice(models.Model):
    """Model for storing stock price data."""
    stock = models.ForeignKey(
        Stock, 
        on_delete=models.CASCADE,
        related_name='prices'
    )
    date = models.DateField()
    open_price = models.DecimalField(max_digits=10, decimal_places=2)
    high_price = models.DecimalField(max_digits=10, decimal_places=2)
    low_price = models.DecimalField(max_digits=10, decimal_places=2)
    close_price = models.DecimalField(max_digits=10, decimal_places=2)
    volume = models.BigIntegerField()
    adj_close = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('stock', 'date')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['stock', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.stock.symbol} - {self.date}"


class StockPrediction(models.Model):
    """Model for storing ML predictions for stocks over a 72-hour window."""
    symbol = models.CharField(max_length=20)
    target_time = models.DateTimeField()
    
    # 30-day context
    current_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    min_price_30d = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_price_30d = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Predictions
    arima_prediction = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    lstm_prediction = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cnn_prediction = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Evaluation (populated later)
    actual_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    arima_error = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    lstm_error = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cnn_error = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Prediction for {self.symbol} at {self.target_time}"


class StockEmbedding(models.Model):
    """Vector representation of a stock for semantic search / chatbot."""
    stock = models.OneToOneField(
        Stock,
        on_delete=models.CASCADE,
        related_name='vector',
    )
    context = models.TextField(help_text="Concise description and metrics used for embeddings")
    # Defaulting to 1024 dims to align with qwen3-embedding:0.6b (Ollama)
    embedding = VectorField(dimensions=1024, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = []

    def __str__(self):
        return f"Embedding for {self.stock.symbol}"
