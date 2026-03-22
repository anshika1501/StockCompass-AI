from django.contrib import admin
from .models import StockCategory, Stock, StockPrice


@admin.register(StockCategory)
class StockCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('symbol', 'name', 'category', 'exchange', 'currency', 'is_active', 'created_at')
    list_filter = ('category', 'exchange', 'currency', 'is_active', 'sector')
    search_fields = ('symbol', 'name', 'sector', 'industry')
    ordering = ('symbol',)
    list_per_page = 50
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('symbol', 'name', 'category', 'is_active')
        }),
        ('Market Information', {
            'fields': ('exchange', 'currency', 'sector', 'industry', 'market_cap')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StockPrice)
class StockPriceAdmin(admin.ModelAdmin):
    list_display = ('stock', 'date', 'close_price', 'volume', 'created_at')
    list_filter = ('date', 'stock__category')
    search_fields = ('stock__symbol', 'stock__name')
    ordering = ('-date', 'stock__symbol')
    list_per_page = 100
    
    fieldsets = (
        ('Stock Information', {
            'fields': ('stock', 'date')
        }),
        ('Price Data', {
            'fields': ('open_price', 'high_price', 'low_price', 'close_price', 'adj_close')
        }),
        ('Volume', {
            'fields': ('volume',)
        })
    )
    readonly_fields = ('created_at',)