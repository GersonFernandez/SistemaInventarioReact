"""
Management command: seed_products
Inserts 20 sample products (with 2 suppliers) only if the database has no products.
Safe to call multiple times (idempotent).
"""
import hashlib
import os
from io import BytesIO
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw, ImageFont

from inventory.models import Product, Supplier

CATEGORY_STYLES = {
    'Electronica': {'bg_top': (22, 44, 79), 'bg_bottom': (8, 17, 33), 'accent': (0, 191, 255), 'badge': 'ELECTRONICA'},
    'Almacenamiento': {'bg_top': (54, 70, 60), 'bg_bottom': (20, 31, 25), 'accent': (103, 192, 140), 'badge': 'STORAGE'},
    'Perifericos': {'bg_top': (72, 34, 94), 'bg_bottom': (31, 14, 41), 'accent': (255, 102, 196), 'badge': 'PERIFERICOS'},
    'Redes': {'bg_top': (18, 72, 95), 'bg_bottom': (8, 31, 41), 'accent': (58, 223, 255), 'badge': 'REDES'},
    'Energia': {'bg_top': (91, 61, 9), 'bg_bottom': (46, 29, 4), 'accent': (255, 195, 0), 'badge': 'ENERGIA'},
    'Impresion': {'bg_top': (80, 22, 47), 'bg_bottom': (35, 9, 20), 'accent': (255, 99, 132), 'badge': 'IMPRESION'},
    'Mobiliario': {'bg_top': (71, 52, 37), 'bg_bottom': (30, 21, 15), 'accent': (210, 168, 120), 'badge': 'MOBILIARIO'},
}

SUPPLIERS = [
    {
        'name': 'TechDistrib SA de CV',
        'rfc': 'TDI123456ABC',
        'email': 'ventas@techdistrib.mx',
        'phone': '+525512345678',
        'contact_name': 'Carlos Ruiz',
        'address': 'Av. Insurgentes 123, CDMX',
    },
    {
        'name': 'Importadora Global SRL',
        'rfc': 'IGS987654XYZ',
        'email': 'compras@iglobal.com',
        'phone': '+523398765432',
        'contact_name': 'Ana Torres',
        'address': 'Blvd. Puerta de Hierro 45, Guadalajara',
    },
]

PRODUCTS = [
    # Electrónica
    {'sku': 'MON-001', 'name': 'Monitor LG 27" 4K UHD',        'category': 'Electronica',    'price': '349.99', 'stock': 15, 'desc': 'Panel IPS, HDR10, 99% sRGB.',                'sup': 0},
    {'sku': 'LAP-002', 'name': 'Laptop Dell XPS 15',           'category': 'Electronica',    'price': '1299.00','stock': 8,  'desc': 'Intel Core i7, 16 GB RAM, SSD 512 GB.',    'sup': 0},
    {'sku': 'TAB-003', 'name': 'Tablet Samsung Galaxy Tab S9', 'category': 'Electronica',    'price': '749.00', 'stock': 12, 'desc': 'AMOLED 11", 256 GB, WiFi 6.',              'sup': 0},
    {'sku': 'CEL-004', 'name': 'Smartphone iPhone 15 Pro',     'category': 'Electronica',    'price': '999.00', 'stock': 20, 'desc': 'A17 Pro chip, cámara 48 MP, titanio.',      'sup': 0},
    # Almacenamiento
    {'sku': 'SSD-005', 'name': 'SSD Samsung 1 TB NVMe',        'category': 'Almacenamiento', 'price': '99.00',  'stock': 25, 'desc': 'PCIe 4.0, velocidad lectura 7 000 MB/s.',  'sup': 0},
    {'sku': 'HDD-006', 'name': 'Disco Duro Seagate 4 TB',      'category': 'Almacenamiento', 'price': '79.99',  'stock': 18, 'desc': 'SATA III, 5 400 RPM, caché 256 MB.',        'sup': 1},
    {'sku': 'USB-007', 'name': 'Memoria USB SanDisk 256 GB',   'category': 'Almacenamiento', 'price': '24.99',  'stock': 50, 'desc': 'USB 3.1 Gen 1, hasta 150 MB/s.',            'sup': 1},
    # Periféricos
    {'sku': 'TEC-008', 'name': 'Teclado Mecánico ASUS ROG',    'category': 'Perifericos',    'price': '89.99',  'stock': 10, 'desc': 'Switches Cherry MX Red, RGB por tecla.',   'sup': 1},
    {'sku': 'MOU-009', 'name': 'Mouse Logitech MX Master 3',   'category': 'Perifericos',    'price': '79.99',  'stock': 14, 'desc': 'Sensor MagSpeed, 4 000 DPI, inalámbrico.',  'sup': 0},
    {'sku': 'AUR-010', 'name': 'Auriculares Sony WH-1000XM5',  'category': 'Perifericos',    'price': '349.99', 'stock': 9,  'desc': 'Cancelación de ruido activa, 40 h batería.','sup': 1},
    {'sku': 'WEB-011', 'name': 'Webcam Logitech C920 HD Pro',  'category': 'Perifericos',    'price': '69.99',  'stock': 22, 'desc': 'Full HD 1080p, micrófono estéreo.',          'sup': 0},
    {'sku': 'PAD-012', 'name': 'Mousepad Razer Goliathus XL',  'category': 'Perifericos',    'price': '29.99',  'stock': 35, 'desc': 'Control edition, 920 × 294 mm.',            'sup': 1},
    # Redes
    {'sku': 'RTR-013', 'name': 'Router TP-Link AX5400',        'category': 'Redes',          'price': '149.99', 'stock': 7,  'desc': 'WiFi 6, dual band, OFDMA.',                'sup': 1},
    {'sku': 'SWT-014', 'name': 'Switch Cisco 24 puertos',      'category': 'Redes',          'price': '249.00', 'stock': 5,  'desc': 'Gigabit Ethernet, administrable.',          'sup': 1},
    {'sku': 'CAB-015', 'name': 'Cable UTP Cat 6 (100 m)',      'category': 'Redes',          'price': '39.99',  'stock': 40, 'desc': 'Bobina 100 m, blindado, LSZH.',             'sup': 0},
    # Energía
    {'sku': 'UPS-016', 'name': 'UPS APC Back-UPS 1 500 VA',    'category': 'Energia',        'price': '189.00', 'stock': 6,  'desc': '900 W, 8 tomas, pantalla LCD.',             'sup': 0},
    {'sku': 'REG-017', 'name': 'Regulador Koblenz 2400 W',     'category': 'Energia',        'price': '49.99',  'stock': 30, 'desc': '2400 VA, 8 contactos, filtro de línea.',    'sup': 1},
    # Impresión
    {'sku': 'IMP-018', 'name': 'Impresora HP LaserJet Pro',    'category': 'Impresion',      'price': '299.00', 'stock': 4,  'desc': 'Láser monocromática, 35 ppm, WiFi.',        'sup': 1},
    {'sku': 'TON-019', 'name': 'Tóner HP CF258A Original',     'category': 'Impresion',      'price': '59.99',  'stock': 60, 'desc': 'Negro, rendimiento 3 000 páginas.',         'sup': 0},
    # Mobiliario
    {'sku': 'SIL-020', 'name': 'Silla Ergonómica Herman Miller','category': 'Mobiliario',    'price': '1199.00','stock': 3,  'desc': 'Aeron series, soporte lumbar ajustable.',   'sup': 1},
]


class Command(BaseCommand):
    help = 'Inserta 20 productos de muestra y asigna imagenes PNG si faltan.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--refresh-images',
            action='store_true',
            help='Regenera imagenes aunque el producto ya tenga una asignada.',
        )

    @staticmethod
    def _draw_product_shape(draw, sku_prefix, accent, canvas):
        x1, y1, x2, y2 = canvas
        w = x2 - x1
        h = y2 - y1
        fg = (245, 245, 245)
        stroke = (20, 20, 20)

        if sku_prefix == 'MON':
            draw.rounded_rectangle([(x1 + 40, y1 + 30), (x2 - 40, y1 + int(h * 0.62))], radius=22, fill=fg, outline=stroke, width=4)
            draw.rectangle([(x1 + int(w * 0.44), y1 + int(h * 0.62)), (x1 + int(w * 0.56), y1 + int(h * 0.78))], fill=fg, outline=stroke, width=3)
            draw.rounded_rectangle([(x1 + int(w * 0.32), y1 + int(h * 0.78)), (x1 + int(w * 0.68), y2 - 20)], radius=10, fill=accent, outline=stroke, width=3)
        elif sku_prefix == 'LAP':
            draw.polygon([(x1 + 120, y1 + 70), (x2 - 120, y1 + 70), (x2 - 160, y1 + int(h * 0.58)), (x1 + 160, y1 + int(h * 0.58))], fill=fg, outline=stroke)
            draw.polygon([(x1 + 80, y1 + int(h * 0.62)), (x2 - 80, y1 + int(h * 0.62)), (x2 - 20, y2 - 40), (x1 + 20, y2 - 40)], fill=accent, outline=stroke)
        elif sku_prefix == 'TAB':
            draw.rounded_rectangle([(x1 + 180, y1 + 20), (x2 - 180, y2 - 20)], radius=28, fill=fg, outline=stroke, width=5)
            draw.ellipse([(x2 - 200, y2 - 44), (x2 - 184, y2 - 28)], fill=stroke)
        elif sku_prefix == 'CEL':
            draw.rounded_rectangle([(x1 + 230, y1 + 10), (x2 - 230, y2 - 10)], radius=30, fill=fg, outline=stroke, width=5)
            draw.rectangle([(x1 + 255, y1 + 60), (x2 - 255, y2 - 80)], fill=(210, 228, 255), outline=None)
            draw.ellipse([(x1 + int(w * 0.49), y2 - 45), (x1 + int(w * 0.51), y2 - 25)], fill=stroke)
        elif sku_prefix == 'SSD':
            draw.rounded_rectangle([(x1 + 120, y1 + 110), (x2 - 120, y2 - 110)], radius=20, fill=fg, outline=stroke, width=4)
            draw.rectangle([(x1 + 170, y1 + 170), (x2 - 170, y2 - 170)], outline=accent, width=6)
        elif sku_prefix == 'HDD':
            draw.rounded_rectangle([(x1 + 160, y1 + 60), (x2 - 160, y2 - 60)], radius=18, fill=fg, outline=stroke, width=4)
            draw.ellipse([(x1 + 250, y1 + 120), (x2 - 250, y2 - 120)], outline=accent, width=8)
            draw.ellipse([(x1 + int(w * 0.48), y1 + int(h * 0.48)), (x1 + int(w * 0.52), y1 + int(h * 0.52))], fill=stroke)
        elif sku_prefix == 'USB':
            draw.rounded_rectangle([(x1 + 160, y1 + 180), (x2 - 220, y2 - 180)], radius=18, fill=fg, outline=stroke, width=4)
            draw.rectangle([(x2 - 220, y1 + 210), (x2 - 110, y2 - 210)], fill=accent, outline=stroke, width=3)
            draw.rectangle([(x2 - 185, y1 + 225), (x2 - 160, y1 + 260)], fill=stroke)
            draw.rectangle([(x2 - 150, y1 + 225), (x2 - 125, y1 + 260)], fill=stroke)
        elif sku_prefix == 'TEC':
            draw.polygon([(x1 + 90, y2 - 120), (x2 - 90, y2 - 120), (x2 - 40, y2 - 40), (x1 + 40, y2 - 40)], fill=fg, outline=stroke)
            for i in range(0, 9):
                for j in range(0, 3):
                    kx = x1 + 130 + i * 75
                    ky = y1 + 160 + j * 70
                    draw.rectangle([(kx, ky), (kx + 52, ky + 42)], fill=accent if (i + j) % 2 == 0 else (230, 230, 230), outline=stroke)
        elif sku_prefix == 'MOU':
            draw.ellipse([(x1 + 220, y1 + 60), (x2 - 220, y2 - 40)], fill=fg, outline=stroke, width=4)
            draw.line([(x1 + int(w * 0.5), y1 + 80), (x1 + int(w * 0.5), y1 + 240)], fill=stroke, width=4)
            draw.ellipse([(x1 + int(w * 0.48), y1 + 205), (x1 + int(w * 0.52), y1 + 235)], fill=accent)
        elif sku_prefix == 'AUR':
            draw.arc([(x1 + 180, y1 + 10), (x2 - 180, y2 - 120)], start=200, end=-20, fill=fg, width=20)
            draw.rounded_rectangle([(x1 + 170, y1 + 260), (x1 + 320, y2 - 80)], radius=24, fill=accent, outline=stroke, width=3)
            draw.rounded_rectangle([(x2 - 320, y1 + 260), (x2 - 170, y2 - 80)], radius=24, fill=accent, outline=stroke, width=3)
        elif sku_prefix == 'WEB':
            draw.ellipse([(x1 + int(w * 0.15), y1 + int(h * 0.18)), (x2 - int(w * 0.15), y2 - int(h * 0.22))], fill=fg, outline=stroke, width=4)
            draw.ellipse([(x1 + int(w * 0.36), y1 + int(h * 0.38)), (x2 - int(w * 0.36), y2 - int(h * 0.45))], fill=accent, outline=stroke, width=3)
            draw.polygon([(x1 + int(w * 0.45), y2 - 160), (x1 + int(w * 0.55), y2 - 160), (x1 + int(w * 0.62), y2 - 70), (x1 + int(w * 0.38), y2 - 70)], fill=fg, outline=stroke)
        elif sku_prefix == 'PAD':
            draw.rounded_rectangle([(x1 + 100, y1 + 160), (x2 - 100, y2 - 120)], radius=28, fill=fg, outline=stroke, width=4)
            draw.line([(x1 + 160, y1 + 240), (x2 - 160, y2 - 200)], fill=accent, width=10)
        elif sku_prefix == 'RTR':
            draw.rounded_rectangle([(x1 + 110, y2 - 220), (x2 - 110, y2 - 120)], radius=14, fill=fg, outline=stroke, width=4)
            draw.line([(x1 + 240, y1 + 80), (x1 + 240, y2 - 220)], fill=accent, width=8)
            draw.line([(x2 - 240, y1 + 80), (x2 - 240, y2 - 220)], fill=accent, width=8)
            draw.arc([(x1 + 180, y1 + 90), (x2 - 180, y2 - 260)], start=205, end=-25, fill=accent, width=6)
        elif sku_prefix == 'SWT':
            draw.rounded_rectangle([(x1 + 80, y1 + 190), (x2 - 80, y2 - 130)], radius=10, fill=fg, outline=stroke, width=4)
            for i in range(12):
                px = x1 + 120 + i * 75
                draw.rectangle([(px, y1 + 250), (px + 40, y1 + 285)], fill=accent, outline=stroke)
        elif sku_prefix == 'CAB':
            draw.ellipse([(x1 + 180, y1 + 90), (x2 - 180, y2 - 90)], outline=fg, width=24)
            draw.rectangle([(x2 - 240, y1 + 280), (x2 - 150, y1 + 360)], fill=accent, outline=stroke, width=3)
        elif sku_prefix == 'UPS':
            draw.rounded_rectangle([(x1 + int(w * 0.24), y1 + int(h * 0.06)), (x2 - int(w * 0.24), y2 - int(h * 0.06))], radius=20, fill=fg, outline=stroke, width=4)
            draw.rectangle([(x1 + int(w * 0.30), y1 + int(h * 0.16)), (x2 - int(w * 0.30), y1 + int(h * 0.36))], fill=accent, outline=stroke, width=3)
            draw.ellipse([(x1 + int(w * 0.48), y2 - int(h * 0.20)), (x1 + int(w * 0.52), y2 - int(h * 0.10))], fill=stroke)
        elif sku_prefix == 'REG':
            draw.rounded_rectangle([(x1 + int(w * 0.15), y1 + int(h * 0.32)), (x2 - int(w * 0.15), y2 - int(h * 0.20))], radius=18, fill=fg, outline=stroke, width=4)
            for i in range(4):
                ox = x1 + int(w * 0.22) + i * int(w * 0.22)
                draw.rounded_rectangle([(ox, y1 + int(h * 0.43)), (ox + int(w * 0.14), y1 + int(h * 0.62))], radius=8, fill=accent, outline=stroke, width=3)
        elif sku_prefix == 'IMP':
            draw.rounded_rectangle([(x1 + int(w * 0.18), y1 + int(h * 0.34)), (x2 - int(w * 0.18), y2 - int(h * 0.20))], radius=16, fill=fg, outline=stroke, width=4)
            draw.rectangle([(x1 + int(w * 0.30), y1 + int(h * 0.14)), (x2 - int(w * 0.30), y1 + int(h * 0.36))], fill=accent, outline=stroke, width=3)
            draw.rectangle([(x1 + int(w * 0.30), y2 - int(h * 0.24)), (x2 - int(w * 0.30), y2 - int(h * 0.14))], fill=(225, 225, 225), outline=stroke, width=2)
        elif sku_prefix == 'TON':
            draw.rounded_rectangle([(x1 + int(w * 0.18), y1 + int(h * 0.37)), (x2 - int(w * 0.18), y2 - int(h * 0.28))], radius=16, fill=fg, outline=stroke, width=4)
            draw.rectangle([(x1 + int(w * 0.26), y1 + int(h * 0.44)), (x2 - int(w * 0.26), y2 - int(h * 0.32))], fill=accent, outline=stroke, width=3)
        elif sku_prefix == 'SIL':
            draw.rounded_rectangle([(x1 + int(w * 0.26), y1 + int(h * 0.16)), (x2 - int(w * 0.26), y1 + int(h * 0.55))], radius=40, fill=fg, outline=stroke, width=4)
            draw.rounded_rectangle([(x1 + int(w * 0.32), y1 + int(h * 0.52)), (x2 - int(w * 0.32), y2 - int(h * 0.22))], radius=24, fill=accent, outline=stroke, width=4)
            draw.line([(x1 + int(w * 0.5), y2 - int(h * 0.22)), (x1 + int(w * 0.5), y2 - int(h * 0.08))], fill=stroke, width=6)
            draw.line([(x1 + int(w * 0.5), y2 - int(h * 0.08)), (x1 + int(w * 0.34), y2 - int(h * 0.02))], fill=stroke, width=5)
            draw.line([(x1 + int(w * 0.5), y2 - int(h * 0.08)), (x1 + int(w * 0.66), y2 - int(h * 0.02))], fill=stroke, width=5)
        else:
            draw.rounded_rectangle([(x1 + 170, y1 + 100), (x2 - 170, y2 - 100)], radius=28, fill=fg, outline=stroke, width=4)
            draw.rectangle([(x1 + 250, y1 + 180), (x2 - 250, y2 - 180)], outline=accent, width=7)

    @staticmethod
    def _product_image_bytes(name, sku, category):
        digest = hashlib.md5(sku.encode('utf-8')).hexdigest()
        style = CATEGORY_STYLES.get(category, {
            'bg_top': (34, 34, 52),
            'bg_bottom': (14, 14, 24),
            'accent': (130, 170, 255),
            'badge': 'GENERAL',
        })

        seed_shift = int(digest[0:2], 16)
        bg_top = tuple(max(0, min(255, c + (seed_shift % 18) - 9)) for c in style['bg_top'])
        bg_bottom = tuple(max(0, min(255, c + (seed_shift % 14) - 7)) for c in style['bg_bottom'])
        accent = style['accent']

        width, height = 1200, 800
        image = Image.new('RGB', (width, height), bg_bottom)
        draw = ImageDraw.Draw(image)
        font = ImageFont.load_default()

        for y in range(height):
            ratio = y / float(height - 1)
            r = int(bg_top[0] * (1 - ratio) + bg_bottom[0] * ratio)
            g = int(bg_top[1] * (1 - ratio) + bg_bottom[1] * ratio)
            b = int(bg_top[2] * (1 - ratio) + bg_bottom[2] * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        draw.ellipse([(760, -120), (1320, 440)], fill=(accent[0], accent[1], accent[2]))
        draw.ellipse([(660, 70), (1040, 450)], outline=(255, 255, 255), width=4)

        sku_prefix = sku.split('-')[0].upper()
        Command._draw_product_shape(draw, sku_prefix, accent, (560, 120, 1120, 620))

        draw.rounded_rectangle([(50, 70), (360, 130)], radius=14, fill=accent)
        draw.text((72, 88), style['badge'], fill='black', font=font)
        draw.text((50, 180), f'{name}', fill='white', font=font)
        draw.text((50, 230), f'SKU: {sku}', fill='white', font=font)
        draw.text((50, 280), f'Categoria: {category}', fill='white', font=font)

        draw.rectangle([(50, 560), (1150, 730)], fill=(15, 15, 20))
        draw.text((80, 600), 'Producto de inventario', fill=accent, font=font)

        buffer = BytesIO()
        image.save(buffer, format='PNG')
        return buffer.getvalue()

    def _ensure_product_image(self, product, refresh_images=False):
        file_name = f'{product.sku.lower().replace("-", "_")}.png'
        has_image = bool(product.image)
        if has_image and not refresh_images:
            return False

        content = self._product_image_bytes(product.name, product.sku, product.category or 'General')
        if has_image and product.image.name and os.path.basename(product.image.name) == file_name:
            product.image.delete(save=False)
        product.image.save(file_name, ContentFile(content), save=True)
        return True

    def handle(self, *args, **options):
        refresh_images = options.get('refresh_images', False)

        # Crear / recuperar proveedores
        suppliers = []
        for s in SUPPLIERS:
            obj, created = Supplier.objects.get_or_create(
                name=s['name'],
                defaults={k: v for k, v in s.items() if k != 'name'},
            )
            suppliers.append(obj)

        # Crear productos
        created_count = 0
        images_count = 0
        for p in PRODUCTS:
            product, created = Product.objects.get_or_create(
                sku=p['sku'],
                defaults={
                    'name': p['name'],
                    'category': p['category'],
                    'price': Decimal(p['price']),
                    'stock': p['stock'],
                    'description': p['desc'],
                    'supplier': suppliers[p['sup']],
                    'is_active': True,
                },
            )
            if created:
                created_count += 1
            if self._ensure_product_image(product, refresh_images=refresh_images):
                images_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'seed_products: {created_count} productos creados y {images_count} imagenes asignadas con {len(suppliers)} proveedores.'
        ))
