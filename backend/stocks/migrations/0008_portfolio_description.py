# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0007_portfolio_holding'),
    ]

    operations = [
        migrations.AddField(
            model_name='portfolio',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
