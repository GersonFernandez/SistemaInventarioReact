from django.db import migrations, models


def seed_categories_from_products(apps, schema_editor):
    Category = apps.get_model('inventory', 'Category')
    Product = apps.get_model('inventory', 'Product')

    names = set(
        Product.objects.exclude(category='').values_list('category', flat=True)
    )
    for name in names:
        cleaned = (name or '').strip()
        if cleaned:
            Category.objects.get_or_create(name=cleaned, defaults={'is_active': True})


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_order'),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ('name',),
            },
        ),
        migrations.RunPython(seed_categories_from_products, noop_reverse),
    ]
