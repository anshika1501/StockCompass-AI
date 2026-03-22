from django.db import migrations
import pgvector.django


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0004_resize_embedding_dimension'),
    ]

    operations = [
        migrations.RunSQL(
            "UPDATE stocks_stockembedding SET embedding = NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterField(
            model_name='stockembedding',
            name='embedding',
            field=pgvector.django.VectorField(blank=True, dimensions=768, null=True),
        ),
    ]
