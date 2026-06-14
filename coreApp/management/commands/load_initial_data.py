import json
import os
import sys
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from coreApp.models import Category, Product


CANONICAL_ORDER = [
    "Granos y Abarrotes",
    "Huevos",
    "Panadería",
    "Bebidas",
    "Snacks y Confitería",
    "Aseo Personal",
    "Aseo Hogar",
    "Condimentos y Salsas",
    "Embutidos",
    "Enlatados",
    "Cigarrillos",
    "Verduras",
    "Lácteos",
    "Otros",
]

SIMPLE_RENAMES = {
    "Abarrotes": "Granos y Abarrotes",
    "Condimentos": "Condimentos y Salsas",
}

MERGE_GROUPS = [
    (["Snacks", "Dulces"], "Snacks y Confitería"),
]


class Command(BaseCommand):
    help = "Carga las categorías y productos iniciales para una tienda de barrio"

    def handle(self, *args, **options):
        self._handle_categories()
        self._handle_products()
        self._handle_default_user()

    def _handle_categories(self):
        self.stdout.write("\n== Categorías ==")

        canonicals = set(CANONICAL_ORDER)
        existing = {c.name: c for c in Category.objects.all()}

        for legacy_name, canonical_name in SIMPLE_RENAMES.items():
            legacy = existing.get(legacy_name)
            canonical = existing.get(canonical_name)

            if not legacy:
                continue

            if canonical:
                count = Product.objects.filter(category=legacy).update(
                    category=canonical
                )
                legacy.delete()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  [OK] "{legacy_name}" fusionada en "{canonical_name}"'
                        f" ({count} productos movidos)"
                    )
                )
            else:
                legacy.name = canonical_name
                legacy.save()
                existing[canonical_name] = legacy
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  [OK] Renombrada "{legacy_name}" -> "{canonical_name}"'
                    )
                )

        for legacy_names, canonical_name in MERGE_GROUPS:
            canonical = existing.get(canonical_name)
            legacies_found = [
                n for n in legacy_names if n in existing
            ]

            if canonical:
                for legacy_name in legacies_found:
                    legacy = existing[legacy_name]
                    count = Product.objects.filter(category=legacy).update(
                        category=canonical
                    )
                    legacy.delete()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  [OK] "{legacy_name}" fusionada en "{canonical_name}"'
                            f" ({count} productos movidos)"
                        )
                    )
            elif legacies_found:
                renamed_source = legacies_found[0]
                legacy = existing[renamed_source]
                legacy.name = canonical_name
                legacy.save()
                existing[canonical_name] = legacy
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  [OK] Renombrada "{renamed_source}" -> "{canonical_name}"'
                    )
                )

                for legacy_name in legacies_found[1:]:
                    legacy = existing[legacy_name]
                    count = Product.objects.filter(category=legacy).update(
                        category=existing[canonical_name]
                    )
                    legacy.delete()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  [OK] "{legacy_name}" fusionada en "{canonical_name}"'
                            f" ({count} productos movidos)"
                        )
                    )

        created_count = 0
        for name in CANONICAL_ORDER:
            if name not in existing:
                Category.objects.create(name=name)
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  [OK] Creada categoría "{name}"')
                )

        if created_count == 0:
            self.stdout.write("  * Todas las categorías ya existen")

    def _handle_products(self):
        self.stdout.write("\n== Productos ==")

        # Resolve fixture path — supports PyInstaller frozen mode
        if getattr(sys, 'frozen', False):
            fixture_path = Path(sys._MEIPASS) / "coreApp" / "fixtures" / "initial_data.json"
        else:
            fixture_path = (
                Path(__file__).parent.parent.parent
                / "fixtures"
                / "initial_data.json"
            )

        if not fixture_path.exists():
            self.stdout.write(
                self.style.ERROR(
                    f'  [ERROR] No se encuentra el fixture en {fixture_path}'
                )
            )
            return

        with open(fixture_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        categories = {c.name: c for c in Category.objects.all()}

        fixture_cats = [
            item
            for item in data
            if item["model"] == "coreApp.category"
        ]
        fixture_products = [
            item
            for item in data
            if item["model"] == "coreApp.product"
        ]

        cat_pk_to_name = {
            item["pk"]: item["fields"]["name"] for item in fixture_cats
        }

        created = 0
        skipped = 0

        for item in fixture_products:
            fields = item["fields"]
            cat_name = cat_pk_to_name.get(fields["category"])

            if not cat_name:
                self.stdout.write(
                    self.style.WARNING(
                        f'  [WARN] Categoría (pk={fields["category"]}) no encontrada'
                        f' en fixture, saltando "{fields["name"]}"'
                    )
                )
                continue

            category = categories.get(cat_name)
            if not category:
                self.stdout.write(
                    self.style.WARNING(
                        f'  [WARN] Categoría "{cat_name}" no existe en BD,'
                        f' saltando "{fields["name"]}"'
                    )
                )
                continue

            exists = Product.objects.filter(
                name=fields["name"], category=category
            ).exists()

            if exists:
                skipped += 1
                continue

            kwargs = {
                "name": fields["name"],
                "category": category,
                "price": fields["price"],
                "cost": fields.get("cost", "0.00"),
                "stock": fields.get("stock", 0),
                "min_stock": fields.get("min_stock", 10),
                "description": fields.get("description", ""),
            }
            bc = fields.get("barcode", "")
            if bc:
                kwargs["barcode"] = bc
            Product.objects.create(**kwargs)
            created += 1

        total_in_fixture = len(fixture_products)
        self.stdout.write(
            self.style.SUCCESS(
                f"  [OK] Creados: {created}  |  Ya existían: {skipped}"
                f"  |  Total en fixture: {total_in_fixture}"
            )
        )

    def _handle_default_user(self):
        User = get_user_model()
        self.stdout.write("\n== Usuario por defecto ==")

        if User.objects.exists():
            self.stdout.write(
                "  * Ya existe un usuario en el sistema, no se crea default"
            )
            return

        password = os.getenv('DJANGO_ADMIN_PASSWORD')
        if not password:
            self.stdout.write(self.style.ERROR(
                "  [ERROR] DJANGO_ADMIN_PASSWORD no está definida.\n"
                "  Creá un archivo .env en la raíz del proyecto con:\n"
                "  DJANGO_ADMIN_PASSWORD=la_contraseña_que_quieras"
            ))
            return
        User.objects.create_superuser(
            username="admin",
            email="",
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(
            f'  [OK] Usuario creado: "admin" / "{password}"'
        ))
        self.stdout.write(
            self.style.WARNING(
                "  ⚠️  CAMBIALAapenas inicies sesión en Ajustes -> Perfil"
            )
        )
