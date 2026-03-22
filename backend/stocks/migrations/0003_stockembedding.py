from django.db import migrations, models
from django.contrib.postgres.operations import CreateExtension
import pgvector.django


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0002_stockprediction'),
    ]

    operations = [
        CreateExtension('vector'),
        migrations.CreateModel(
            name='StockEmbedding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('context', models.TextField(help_text='Concise description and metrics used for embeddings')),
                ('embedding', pgvector.django.VectorField(blank=True, dimensions=768, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('stock', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='vector', to='stocks.stock')),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='stockembedding',
            index=pgvector.django.HnswIndex(
                fields=['embedding'],
                name='idx_stock_embedding_hnsw',
                opclasses=['vector_cosine_ops'],
            ),
        ),
    ]
