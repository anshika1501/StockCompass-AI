from django.urls import path
from . import views

app_name = 'stocks'

urlpatterns = [
    # Sector endpoints (frontend calls these)
    path('sectors/', views.sector_list, name='sector-list'),
    path('sectors/<slug:sector_slug>/stocks/', views.stocks_by_sector, name='stocks-by-sector'),
    path('sectors/<slug:sector_slug>/analysis/', views.portfolio_analysis, name='portfolio-analysis'),

    # All stocks endpoint
    path('stocks/', views.all_stocks, name='all-stocks'),

    # Nifty 50 endpoint
    path('nifty50/', views.nifty50_stocks, name='nifty50-stocks'),

    # Gold & Silver analysis
    path('gold-silver/', views.gold_silver_analysis, name='gold-silver-analysis'),

    # Generic asset forecast (BTC, Gold, Silver)
    path('forecast/', views.asset_forecast, name='asset-forecast'),
    path('predictions/', views.stock_predictions, name='stock-predictions'),
    path('predictions/evaluate/', views.evaluate_predictions, name='evaluate-predictions'),

    # Nifty 50 PCA + K-Means clustering
    path('nifty50-pca/', views.nifty50_pca_clustering, name='nifty50-pca'),

    # Live analytics endpoints (must be before <str:ticker> to avoid conflict)
    path('stocks/live-search/', views.live_stock_search, name='live-stock-search'),
    path('stocks/live-detail/', views.live_stock_detail, name='live-stock-detail'),
    path('stocks/live-compare/', views.live_stock_compare, name='live-stock-compare'),

    # Advanced analytics endpoints (must be before <str:ticker> to avoid conflict)
    path('stocks/linear-regression/', views.linear_regression_analysis, name='linear-regression'),
    path('stocks/pca-clustering/', views.pca_clustering_analysis, name='pca-clustering'),
    path('stocks/lstm-prediction/', views.lstm_prediction, name='lstm-prediction'),
    path('stocks/logistic-regression/', views.logistic_regression_analysis, name='logistic-regression'),
    path('stocks/compare-analysis/', views.compare_analysis, name='compare-analysis'),

    # Stock endpoints
    path('stocks/<str:ticker>/', views.stock_detail, name='stock-detail'),
    path('stocks/<str:ticker>/chart/', views.stock_chart, name='stock-chart'),

    # Chatbot (RAG + Gemini)
    path('chatbot/', views.chat_with_stocks, name='chatbot'),
    path('llm/models/', views.list_ollama_models, name='llm-models'),

    # Search
    path('search/', views.stock_search, name='stock-search'),

    # Management
    path('initialize/', views.initialize_stock_data, name='initialize-stock-data'),

    # Auth
    path('login/', views.login_user, name='login-user'),
    path('register/', views.register_user, name='register-user'),
]
