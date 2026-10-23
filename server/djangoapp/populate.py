import json
from pathlib import Path

from .models import CarMake, CarModel


def initiate():
    """Idempotently load the repository's vehicle inventory into Django."""
    if CarModel.objects.exists():
        return
    inventory_path = Path(__file__).resolve().parents[1] / "database" / "data" / "car_records.json"
    with inventory_path.open(encoding="utf-8") as inventory_file:
        cars = json.load(inventory_file).get("cars", [])

    for car in cars:
        make_name = car.get("make", "").strip()
        model_name = car.get("model", "").strip()
        year = car.get("year")
        body_type = (car.get("bodyType") or "").upper()
        if not make_name or not model_name or not isinstance(year, int):
            continue

        make, _ = CarMake.objects.get_or_create(
            name=make_name,
            defaults={"description": f"{make_name} vehicles in the project inventory."},
        )
        valid_types = {choice[0] for choice in CarModel.CAR_TYPES}
        if body_type not in valid_types:
            body_type = "SUV"
        CarModel.objects.get_or_create(
            car_make=make,
            name=model_name,
            year=year,
            defaults={"type": body_type},
        )
