from django.db import migrations
import pgvector.django


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0005_resize_embedding_dim_768'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stockembedding',
            name='embedding',
            field=pgvector.django.VectorField(blank=True, dimensions=1024, null=True),
        ),
    ]
