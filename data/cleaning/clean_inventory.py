"""
clean_inventory.py — turns the raw inventory CSV into the standardised cars.json
used by the frontend, and writes a change log + list of excluded records.

Usage (from the project root):
    python data/cleaning/clean_inventory.py "CAR DEALERSHIP WEBSITE FILE/cars_categorized (2).csv"

Principles
- The raw CSV is never modified.
- Values are only changed when the evidence is inside the same record
  (e.g. the name says "Hybrid", or a VIN sits in the transmission column).
- Anything that cannot be confirmed becomes null and is listed in `dataFlags`.
- Every change is written to data/reports/changes-log.csv.
"""
import csv
import json
import re
import sys
from collections import Counter, OrderedDict
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_JSON = ROOT / "src" / "data" / "cars.json"
OUT_LOG = ROOT / "data" / "reports" / "changes-log.csv"
OUT_EXCLUDED = ROOT / "data" / "reports" / "excluded-records.json"
OUT_STATS = ROOT / "data" / "reports" / "cleaning-stats.json"

PLACEHOLDERS = {"", "–", "-", "—", "n/a", "na", "none", "null", "unknown", "other"}
VIN_RE = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")
HP_ENGINE_RE = re.compile(r"^\d+(\.\d+)?HP\s")

changes = []  # rows for the change log


def log(car_id, field, old, new, reason):
    changes.append({"id": car_id, "field": field, "old": old, "new": new, "reason": reason})


def blank(v):
    return v is None or str(v).strip().lower() in PLACEHOLDERS


def to_int(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# --------------------------------------------------------------------------
# Make / model / variant
# --------------------------------------------------------------------------
# (regex on the original model string, base model name, number of leading words
#  that belong to the base model and are removed to form the variant)
MODEL_RULES = [
    # Land Rover: raw make is "Land", model starts with "Rover"
    (r"^Range Rover Sport\b", "Range Rover Sport", 3),
    (r"^Range Rover Velar\b", "Range Rover Velar", 3),
    (r"^Range Rover Evoque\b", "Range Rover Evoque", 3),
    (r"^Range Rover\b", "Range Rover", 2),
    # multi-word base models
    (r"^Grand Cherokee\b", "Grand Cherokee", 2),
    (r"^Grand Wagoneer\b", "Grand Wagoneer", 2),
    (r"^Grand Caravan\b", "Grand Caravan", 2),
    (r"^Santa Fe\b", "Santa Fe", 2),
    (r"^Model [3SXY]\b", None, 2),            # Tesla Model 3/S/X/Y
    (r"^Mustang Mach-E\b", "Mustang Mach-E", 2),
    (r"^Bronco Sport\b", "Bronco Sport", 2),
    (r"^Corolla Cross\b", "Corolla Cross", 2),
    (r"^Atlas Cross Sport\b", "Atlas Cross Sport", 3),
    (r"^Encore GX\b", "Encore GX", 2),
    (r"^Blazer EV\b", "Blazer EV", 2),
    (r"^HUMMER EV\b", "HUMMER EV", 2),
    (r"^Versa Note\b", "Versa Note", 2),
    (r"^XV Crosstrek\b", "XV Crosstrek", 2),
    (r"^MX-5 Miata\b", "MX-5 Miata", 2),
    (r"^Cooper Countryman\b", "Countryman", 2),
    (r"^Convertible Cooper\b", "Cooper", 2),   # MINI "Convertible Cooper S"
    (r"^718 (Boxster|Cayman)\b", None, 2),
    (r"^Shelby (GT350|GT500)\b", "Mustang", 0),
    (r"^Transit-\d+", "Transit", 0),
    (r"^RS \d\b", None, 2),                    # Audi RS 3 / RS 5 / RS 6
    (r"^A6 allroad\b", "A6 allroad", 2),
    (r"^M Roadster\b", "M Roadster", 2),
    # Mercedes-Benz naming
    (r"^AMG GT\b", "AMG GT", 2),
    (r"^AMG (A|C|E|G|S)\b", "{1}-Class", 1),
    (r"^AMG (\w+)", "{1}", 1),
    (r"^(C|E|S|R)-Class\b", "{1}-Class", 1),
    (r"^CLS-Class\b", "CLS", 1),
    (r"^GLE-Class\b", "GLE", 1),
    # BMW numeric models -> Series
    (r"^(128|135)\w*\b", "1 Series", 0),
    (r"^(228|M235)\w*\b", "2 Series", 0),
    (r"^(328|330|335)\w*\b", "3 Series", 0),
    (r"^(430|435|440)\w*\b", "4 Series", 0),
    (r"^(530|540|M550)\w*\b", "5 Series", 0),
    (r"^(745|760)\w*\b", "7 Series", 0),
    (r"^M850\w*\b", "8 Series", 0),
    (r"^ALPINA\b", "ALPINA", 1),
]


def split_model(make, raw_model):
    """Return (baseModel, variant) without losing any words of the original."""
    model = raw_model.strip()
    for pattern, base, n_words in MODEL_RULES:
        m = re.match(pattern, model)
        if not m:
            continue
        words = model.split()
        if base is None:
            base = " ".join(words[:n_words])
        elif "{1}" in base:
            base = base.replace("{1}", m.group(1))
        variant = " ".join(words[n_words:]) if n_words else model
        return base, (variant or None)
    words = model.split()
    base = words[0]
    variant = " ".join(words[1:]) or None
    # avoid repeating the base name in the variant, e.g. "G35 G35" / "530e 530e"
    if variant and variant.split()[0] == base:
        variant = " ".join(variant.split()[1:]) or None
    return base, variant


# --------------------------------------------------------------------------
# Drivetrain / transmission / engine
# --------------------------------------------------------------------------
DRIVETRAIN_MAP = {
    "all-wheel drive": "AWD", "awd": "AWD",
    "front-wheel drive": "FWD", "fwd": "FWD",
    "rear-wheel drive": "RWD", "rwd": "RWD",
    "four-wheel drive": "4WD", "4wd": "4WD",
}


def parse_transmission(raw):
    """Return (type, gears, detail). type in Automatic / Manual / CVT / Dual-clutch."""
    t = raw.strip()
    low = t.lower()
    if "manual" in low:
        kind = "Manual"
    elif re.search(r"double clutch|doppelkupplung|pdk|dsg|dual[- ]clutch", low):
        kind = "Dual-clutch"
    elif re.search(r"\bcvt\b|ecvt|\bivt\b|xtronic|variable", low):
        kind = "CVT"
    elif re.search(r"auto|shiftronic|steptronic|tiptronic|geartronic|selectshift", low):
        kind = "Automatic"
    else:
        return None, None, t
    g = re.search(r"(\d+)[- ]?(speed|spd)", low)
    gears = int(g.group(1)) if g else None
    return kind, gears, t


def parse_engine(raw):
    """Pull displacement (litres) and horsepower out of free-text engine strings."""
    if not raw:
        return None, None
    disp = re.search(r"(\d+(?:\.\d)?)\s?L\b", raw)
    displacement = float(disp.group(1)) if disp else None
    if displacement is not None and not (0.6 <= displacement <= 8.5):
        displacement = None
    hp = re.search(r"(\d{2,4})(?:\.0)?\s?(?:hp|HP)\b", raw)
    horsepower = int(hp.group(1)) if hp else None
    return displacement, horsepower


def is_engine_text(v):
    """True if the string really describes an engine (not a stock code / VIN)."""
    return bool(re.search(r"\d(\.\d)?\s?L\b|\bV-?\d{1,2}\b|\bI-?\d\b|\bH-?\d\b|cylinder|hp\b|kW|electric|motor|rotary",
                          v, re.I))


# --------------------------------------------------------------------------
# Fuel type
# --------------------------------------------------------------------------
EV_PATTERNS = [
    r"^Tesla ", r"^Lucid ", r"^Polestar 2", r"Lightning", r"Mach-E", r"\bEQ[ABCES]\b",
    r"\bLeaf\b", r"\bBolt\b", r"IONIQ [56]", r"Kona EV", r"\bEV6\b", r"\bNiro EV\b",
    r"\bbZ4X\b", r"\bARIYA\b", r"\biX\b", r"\bi3\b(?!.*REx)", r"\bi4\b", r"HUMMER EV",
    r"Blazer EV", r"XC40 Recharge", r"^Audi e-tron", r"\bTaycan\b", r"\bID\.4\b",
]
PHEV_PATTERNS = [
    r"Plug-In", r"\bPHEV\b", r"E-Hybrid", r"\be-tron\b.*1\.4T", r"A3 e-tron", r"Recharge.*T8",
    r"\b530e\b", r"\b745e\b", r"X5 xDrive45e", r"X5 eDrive", r"\bA7 e\b", r"Polestar 1",
    r"Karma Revero", r"Pacifica Hybrid", r"NX 450h\+", r"Escape PHEV", r"Wrangler 4xe", r"\b4xe\b",
]


def infer_fuel(title, engine_text):
    """Evidence-based fuel type. Returns (fuelType or None, evidence string)."""
    for p in PHEV_PATTERNS:
        if re.search(p, title):
            return "Plug-in Hybrid", f"name matches '{p}'"
    if engine_text and re.search(r"plug-in", engine_text, re.I):
        return "Plug-in Hybrid", "engine text says plug-in"
    for p in EV_PATTERNS:
        if re.search(p, title):
            return "Electric", f"name matches '{p}'"
    if re.search(r"hybrid|\b\d{3}h\b|\bCT 200h\b", title, re.I):
        return "Hybrid", "name says hybrid"
    if engine_text:
        if re.search(r"range-extended electric", engine_text, re.I):
            return "Plug-in Hybrid", "engine text says range-extended electric"
        if re.search(r"hybrid|gas/electric", engine_text, re.I):
            return "Hybrid", "engine text says hybrid / gas-electric"
        if re.search(r"diesel", engine_text, re.I):
            return "Diesel", "engine text says diesel"
    if re.search(r"\bTDI\b|\b\d{3}d\b|BlueTEC|EcoDiesel|Duramax|Power Stroke", title):
        return "Diesel", "name has diesel badge"
    if engine_text and re.search(r"gasoline|\bgas\b|GDI|MPFI|PDI|SIDI|SFI|flex", engine_text, re.I):
        return "Petrol", "engine text says petrol/gasoline injection"
    return None, None


# --------------------------------------------------------------------------
# Colours
# --------------------------------------------------------------------------
COLOR_FAMILY_RULES = [
    ("White", r"white|bianco|pearl white|snow|polar|ivory|alabaster(?! silver)|chalk|fresh powder|blizzard|wind chill|iridescent|star white|fuji|marble|casablanca|aspen|uyuni|taffeta|rhodium|candy white|summit"),
    ("Black", r"black|ebony|onyx|obsidian|noir|nero|caviar|raven|void|midnight|pitch|santorini|narvik|vik|mythos|carbon black|jet|berlina"),
    ("Silver", r"silver|platinum|chrome|iridium|billet|quicksilver|ice silver|tungsten|magnesium|metal\b|alloy|liquid platinum|sterling metallic|silverstone|celestite|satellite"),
    ("Gray", r"gr[ae]y|graphite|granite|charcoal|gun metal|magnetic|pewter|steel|stone gray|daytona|carpathian|eiger|donington|ammonite|baltic|portofino|machine|quantum|pavement|polymetal|iron frost|stealth|selenite|himalayan|predawn|sonic|meteorite|area 51|riverrock|wilder|storm bay|liquid carbon|chromium|sterling"),
    ("Blue", r"blue|navy|sapphire|indigo|denim|azure|aegean|portimao|fathom|caspian|cerulean|astra|hagane|navarra|san marino|rip tide|velocity blue|lakeshore|bodega"),
    ("Red", r"red|crimson|carmine|cherry|ruby|scarlet|cinnabar|calypso|jupiter|currant|garnet|gemstone|soul red|torch|velvet"),
    ("Green", r"green|emerald|moss|pine|jade|cactus|lime|pangea|eruption"),
    ("Brown", r"brown|bronze|mocha|copper|brass|earthy|manhattan brown|sunburst|seashell|gondwana"),
    ("Beige", r"beige|tan\b|sand|champagne|cashmere"),
    ("Orange", r"orange|ember|omaha"),
    ("Yellow", r"yellow|gold(?! coast)"),
    ("Purple", r"purple|violet|plum"),
]


def color_family(name):
    if not name:
        return None
    for fam, pat in COLOR_FAMILY_RULES:
        if re.search(pat, name, re.I):
            return fam
    return None


def tidy_color(name):
    """Fix ALL-CAPS colour names ("BLACK" -> "Black"); keep official names otherwise."""
    if name.isupper() and len(name) > 2:
        return name.title()
    return name


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main(csv_path):
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    stats = Counter()
    cars, excluded = [], []
    seen = {}
    seller_ids = OrderedDict()

    for idx, r in enumerate(rows, start=1):
        cid = r["id"].strip()
        flags = []
        source_row = idx + 1  # +1 for header line in the CSV

        # ---- duplicate detection: same vehicle details, different id
        dup_key = (r["name"], r["mileage"], r["price_usd"], r["exterior_color"], r["location"])
        if dup_key in seen:
            excluded.append({"id": cid, "sourceRow": source_row, "reason": "duplicate",
                             "duplicateOf": seen[dup_key],
                             "note": "Identical to the kept record in every field except id and quantity."})
            stats["excluded_duplicates"] += 1
            continue
        seen[dup_key] = cid

        # ---- make / model
        make = r["make"].strip()
        raw_model = r["model"].strip()
        if make == "Land" and raw_model.startswith("Rover "):
            log(cid, "make", make, "Land Rover", "brand name was split across make and model")
            make = "Land Rover"
            raw_model = raw_model[len("Rover "):]
            stats["fixed_land_rover"] += 1
        base_model, variant = split_model(make, raw_model)
        year = to_int(r["manufacture_year"])
        title = f"{year} {make} {raw_model}"

        # ---- numbers
        price = to_int(r["price_usd"])
        mileage = to_int(r["mileage"])

        # ---- engine & VIN rescue
        vin = None
        engine_raw = r["engine"].strip()
        trans_raw = r["transmission"].strip()
        engine = None
        if not blank(engine_raw):
            if VIN_RE.match(engine_raw):
                vin = engine_raw
                log(cid, "engine", engine_raw, None, "value is a VIN, moved to vin")
                stats["vin_from_engine"] += 1
            elif is_engine_text(engine_raw):
                engine = engine_raw.rstrip(", ")
                if len(engine_raw) >= 63:
                    flags.append("engineTextTruncated")
                    stats["engine_truncated"] += 1
            else:
                log(cid, "engine", engine_raw, None, "value is a stock code, not an engine description")
                stats["engine_stock_code"] += 1

        # ---- transmission
        transmission = gears = transmission_detail = None
        if blank(trans_raw):
            if trans_raw:
                log(cid, "transmission", trans_raw, None, "placeholder value")
            stats["transmission_missing"] += 1
        elif VIN_RE.match(trans_raw):
            vin = vin or trans_raw
            log(cid, "transmission", trans_raw, None, "value is a VIN, moved to vin")
            stats["vin_from_transmission"] += 1
            stats["transmission_missing"] += 1
        elif HP_ENGINE_RE.match(trans_raw):
            log(cid, "transmission", trans_raw, None, "value is an engine description")
            stats["engine_in_transmission"] += 1
            stats["transmission_missing"] += 1
            if engine is None:
                engine = trans_raw
                log(cid, "engine", engine_raw or None, trans_raw, "engine description recovered from transmission column")
        else:
            transmission, gears, transmission_detail = parse_transmission(trans_raw)
            if transmission is None:
                flags.append("transmissionUnrecognised")
            if transmission_detail != transmission:
                stats["transmission_standardised"] += 1

        # electric cars: single-speed reduction gear is effectively automatic
        displacement, horsepower = parse_engine(engine)

        # ---- fuel type (evidence based)
        orig_fuel = r["fuel_type"].strip()
        inferred, evidence = infer_fuel(f"{make} {raw_model}", engine)
        if inferred:
            fuel = inferred
            if inferred != orig_fuel:
                log(cid, "fuelType", orig_fuel, inferred, f"corrected from record evidence: {evidence}")
                stats["fuel_corrected"] += 1
        else:
            if orig_fuel == "Petrol":
                fuel = "Petrol"
                flags.append("fuelTypeUnconfirmed")
                stats["fuel_petrol_unconfirmed"] += 1
            else:
                fuel = None
                flags.append("fuelTypeConflict")
                log(cid, "fuelType", orig_fuel, None,
                    "original label not supported by name or engine; set to unknown")
                stats["fuel_set_unknown"] += 1
        if fuel == "Electric":
            displacement = None
            if transmission is None:
                pass  # leave unknown rather than assume

        # ---- drivetrain
        dt_raw = r["drivetrain"].strip()
        drivetrain = None if blank(dt_raw) else DRIVETRAIN_MAP.get(dt_raw.lower())
        if not blank(dt_raw) and drivetrain is None:
            flags.append("drivetrainUnrecognised")
        if dt_raw in ("AWD", "FWD"):
            stats["drivetrain_abbrev_unified"] += 1
        if dt_raw and drivetrain is None and blank(dt_raw):
            log(cid, "drivetrain", dt_raw, None, "placeholder value")

        # ---- colours
        ext_raw, int_raw = r["exterior_color"].strip(), r["interior_color"].strip()
        exterior = None if blank(ext_raw) else tidy_color(ext_raw)
        interior = None if blank(int_raw) else tidy_color(int_raw)
        for fld, old, new in (("exteriorColor", ext_raw, exterior), ("interiorColor", int_raw, interior)):
            if old and new is None:
                log(cid, fld, old, None, "placeholder value")
            elif new and new != old:
                log(cid, fld, old, new, "ALL-CAPS colour name")
        # interior codes that are not colours
        if interior and re.fullmatch(r"B6x7|Bk|Rb|Nh-883p/Black|Sport|Interlagos|Palisades( Sport)?", interior):
            flags.append("interiorColorIsCode")
        ext_family = color_family(exterior)
        if exterior and ext_family is None:
            flags.append("exteriorColorFamilyUnknown")

        # ---- fuel economy (raw columns mpg_min / mpg_max)
        lo, hi = to_float(r["mpg_min"]), to_float(r["mpg_max"])
        econ = None
        if lo is None or hi is None or lo < 5 or hi < 5:
            if (lo, hi) != (None, None):
                log(cid, "fuelEconomy", f"{r['mpg_min']}-{r['mpg_max']}", None, "zero or implausible value")
            stats["economy_missing"] += 1
        else:
            unit = "MPGe" if fuel == "Electric" else "mpg"
            econ = {"min": min(lo, hi), "max": max(lo, hi), "unit": unit}
            if lo > hi:
                stats["economy_reordered"] += 1

        # ---- seller (anonymised; one id per distinct source address)
        loc = r["location"].strip()
        seller_id = None
        if loc:
            if loc not in seller_ids:
                seller_ids[loc] = f"SELLER-{len(seller_ids) + 1:03d}"
            seller_id = seller_ids[loc]

        # ---- plausibility flags (kept, not changed)
        if year and year >= 2025 and mileage and mileage > 40000:
            flags.append("highMileageForYear")
        if year and year < 2000 and mileage and mileage < 5000:
            flags.append("lowMileageForAge")

        # ---- factual description built only from the record
        desc_parts = [f"{title}."]
        if exterior:
            desc_parts.append(f"Finished in {exterior}" + (f" with a {interior} interior." if interior else "."))
        spec = [s for s in [
            {"AWD": "All-wheel drive", "FWD": "Front-wheel drive", "RWD": "Rear-wheel drive", "4WD": "Four-wheel drive"}.get(drivetrain),
            (f"{gears}-speed {transmission.lower()}" if gears and transmission else (transmission.lower() if transmission else None)),
            engine if engine and len(engine) < 40 else (f"{displacement}L engine" if displacement else None),
        ] if s]
        if spec:
            desc_parts.append(", ".join(spec)[0].upper() + ", ".join(spec)[1:] + ".")
        if mileage is not None:
            desc_parts.append(f"{mileage:,} miles on the odometer.")
        desc_parts.append("No accidents or damage reported." if r["accidents_or_damage"].startswith("None")
                          else "At least one accident or damage event has been reported.")

        car = OrderedDict([
            ("id", cid),
            ("stockNumber", None),  # filled after sorting
            ("title", title),
            ("make", make),
            ("model", base_model),
            ("variant", variant),
            ("year", year),
            ("price", price),
            ("mileage", mileage),
            ("fuelType", fuel),
            ("transmission", transmission),
            ("transmissionDetail", transmission_detail),
            ("gears", gears),
            ("drivetrain", drivetrain),
            ("bodyType", r["category"].strip()),
            ("engine", engine),
            ("engineCapacityL", displacement),
            ("horsepower", horsepower),
            ("exteriorColor", exterior),
            ("exteriorColorFamily", ext_family),
            ("interiorColor", interior),
            ("doors", None),
            ("seats", None),
            ("condition", "Used"),
            ("accidentHistory", "none-reported" if r["accidents_or_damage"].startswith("None") else "reported"),
            ("fuelEconomy", econ),
            ("vin", vin),
            ("sellerId", seller_id),
            ("description", " ".join(desc_parts)),
            ("descriptionSource", "generated-from-record"),
            ("images", []),  # filled by build_images.py
            ("listingStatus", "available"),
            ("listedAt", None),
            ("dataFlags", sorted(set(flags))),
            ("sourceRow", source_row),
        ])
        cars.append(car)

    # Stock numbers + demo listing dates (deterministic, clearly demo-only)
    base_day = date(2026, 10, 1)
    for i, car in enumerate(cars):
        car["stockNumber"] = f"CAR-{i + 1:04d}"
        car["listedAt"] = (base_day - timedelta(days=(i * 37) % 90)).isoformat()

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_LOG.parent.mkdir(parents=True, exist_ok=True)
    meta = {
        "generatedFrom": Path(csv_path).name,
        "recordCountRaw": len(rows),
        "recordCount": len(cars),
        "priceCurrency": "USD",
        "mileageUnit": "mi",
        "notes": "listedAt values are demo-only dates; images are illustrations, not photos of the listed vehicles.",
    }
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "cars": cars}, f, ensure_ascii=False, indent=2)
    with open(OUT_LOG, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "field", "old", "new", "reason"])
        w.writeheader()
        w.writerows(changes)
    with open(OUT_EXCLUDED, "w", encoding="utf-8") as f:
        json.dump(excluded, f, indent=2)
    stats["sellers"] = len(seller_ids)
    stats["changes_logged"] = len(changes)
    with open(OUT_STATS, "w", encoding="utf-8") as f:
        json.dump(dict(stats), f, indent=2, sort_keys=True)
    print(json.dumps(dict(stats), indent=2, sort_keys=True))


if __name__ == "__main__":
    main(sys.argv[1])
