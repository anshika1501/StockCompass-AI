from django.db import migrations
import pgvector.django


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0003_stockembedding'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='stockembedding',
            name='idx_stock_embedding_hnsw',
        ),
        migrations.AlterField(
            model_name='stockembedding',
            name='embedding',
            field=pgvector.django.VectorField(blank=True, dimensions=3072, null=True),
        ),
    ]
