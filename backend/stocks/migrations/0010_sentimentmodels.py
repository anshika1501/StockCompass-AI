from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0009_usersecurityprofile'),
    ]

    operations = [
        migrations.CreateModel(
            name='SentimentArticle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ticker', models.CharField(db_index=True, max_length=20)),
                ('company_name', models.CharField(blank=True, default='', max_length=255)),
                ('sector', models.CharField(db_index=True, max_length=120)),
                ('headline', models.TextField()),
                ('snippet', models.TextField(blank=True, default='')),
                ('source', models.CharField(
                    choices=[
                        ('yahoo_finance', 'Yahoo Finance'),
                        ('economic_times', 'Economic Times'),
                        ('money_control', 'MoneyControl'),
                    ],
                    default='yahoo_finance',
                    max_length=30,
                )),
                ('url', models.URLField(blank=True, default='', max_length=1000)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('compound_score', models.FloatField(default=0.0)),
                ('label', models.CharField(
                    choices=[('BULLISH', 'Bullish'), ('NEUTRAL', 'Neutral'), ('BEARISH', 'Bearish')],
                    default='NEUTRAL',
                    max_length=10,
                )),
                ('fetched_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-published_at', '-fetched_at'],
            },
        ),
        migrations.AddIndex(
            model_name='sentimentarticle',
            index=models.Index(fields=['ticker', 'fetched_at'], name='sentiment_ticker_fetched_idx'),
        ),
        migrations.AddIndex(
            model_name='sentimentarticle',
            index=models.Index(fields=['sector', 'fetched_at'], name='sentiment_sector_fetched_idx'),
        ),
        migrations.CreateModel(
            name='SectorSentimentSnapshot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sector', models.CharField(db_index=True, max_length=120)),
                ('date', models.DateField(db_index=True)),
                ('avg_score', models.FloatField(default=0.0)),
                ('bullish_count', models.IntegerField(default=0)),
                ('neutral_count', models.IntegerField(default=0)),
                ('bearish_count', models.IntegerField(default=0)),
                ('article_count', models.IntegerField(default=0)),
                ('label', models.CharField(
                    choices=[('BULLISH', 'Bullish'), ('NEUTRAL', 'Neutral'), ('BEARISH', 'Bearish')],
                    default='NEUTRAL',
                    max_length=10,
                )),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-date', 'sector'],
                'unique_together': {('sector', 'date')},
            },
        ),
    ]
