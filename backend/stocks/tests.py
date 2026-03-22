from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import StockCategory, Stock, StockPrice
from datetime import date, datetime
from decimal import Decimal


class StockCategoryModelTest(TestCase):
    def setUp(self):
        self.category = StockCategory.objects.create(
            name='Technology',
            description='Technology sector stocks'
        )
    
    def test_category_creation(self):
        self.assertEqual(self.category.name, 'Technology')
        self.assertEqual(str(self.category), 'Technology')


class StockModelTest(TestCase):
    def setUp(self):
        self.category = StockCategory.objects.create(
            name='Technology',
            description='Technology sector stocks'
        )
        self.stock = Stock.objects.create(
            symbol='AAPL',
            name='Apple Inc.',
            category=self.category,
            exchange='NASDAQ',
            currency='USD'
        )
    
    def test_stock_creation(self):
        self.assertEqual(self.stock.symbol, 'AAPL')
        self.assertEqual(self.stock.name, 'Apple Inc.')
        self.assertEqual(str(self.stock), 'AAPL - Apple Inc.')


class StockAPITest(APITestCase):
    def setUp(self):
        self.category = StockCategory.objects.create(
            name='Technology',
            description='Technology sector stocks'
        )
        self.stock = Stock.objects.create(
            symbol='AAPL',
            name='Apple Inc.',
            category=self.category,
            exchange='NASDAQ',
            currency='USD'
        )
    
    def test_category_list_api(self):
        url = reverse('stocks:category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_stocks_by_category_api(self):
        url = reverse('stocks:stocks-by-category', kwargs={'category_id': self.category.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_stock_detail_api(self):
        url = reverse('stocks:stock-detail', kwargs={'pk': self.stock.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['symbol'], 'AAPL')
    
    def test_stock_search_api(self):
        url = reverse('stocks:stock-search')
        response = self.client.get(url, {'q': 'AAPL'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)