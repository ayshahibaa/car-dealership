# Inventory Data Quality Report

- **Source:** `CAR DEALERSHIP WEBSITE FILE/cars_categorized (2).csv` (687 rows, 22 columns, UTF-8 with BOM). The original is unchanged.
- **Output:** `src/data/cars.json` (686 records).
- **Produced by:** `data/cleaning/clean_inventory.py` and `data/cleaning/build_images.py`.
- **Every change, record by record:** `data/reports/changes-log.csv` (326 entries).
- **Removed records:** `data/reports/excluded-records.json` (1 entry).

## 1. Summary

| | Count |
|---|---|
| Raw records | 687 |
| Cleaned records | 686 |
| Records removed | 1 (duplicate, see §3) |
| Records with no data flag | 434 |
| Records with at least one data flag | 252 (mostly engine text cut off or fuel type unconfirmed) |
| Records failing validation | 0 |
| Distinct makes / base models / sellers | 41 / 263 / 233 |

**Already clean, no changes needed:**

- All 687 IDs are unique.
- The `name` field always equals year + make + model.
- There is no stray whitespace.
- Price ($3,660 to $104,300), mileage (1,001 to 99,994) and year (1991 to 2025) are all numeric and within plausible ranges.
- The 9 body-type categories are consistent.

## 2. Inconsistencies detected

| # | Issue | Records |
|---|---|---|
| 1 | Brand split across columns: make `Land`, model `Rover Range Rover…` | 12 |
| 2 | VIN numbers in the `transmission` column | 29 |
| 3 | VIN numbers in the `engine` column | 13 |
| 4 | Engine descriptions in the `transmission` column (`600.0HP 4.4L 8 Cylinder…`) | 13 |
| 5 | Stock codes in the `engine` column (`RF055398`, `C2316P`, `A866`) | 35 |
| 6 | Placeholder `–` or `Other` used instead of an empty value | ~60 fields |
| 7 | Transmission written 87 different ways | 600+ |
| 8 | Drivetrain written two ways (`AWD` / `All-wheel Drive`, `FWD` / `Front-wheel Drive`) | 10 |
| 9 | ALL-CAPS colour names (`BLACK`, `SILVER`, `TAN`) | ~20 |
| 10 | **Fuel type mislabelled**: hybrids, plug-ins and EVs marked `Diesel`; petrol cars marked `Hybrid`/`Electric`. Only 14 of the 89 "Diesel" cars actually have a diesel engine. | 109 |
| 11 | Fuel economy of `0`, or `1.0` for an EV | 38 |
| 12 | `mpg_min` > `mpg_max`. **Not an error:** these are EVs and hybrids, whose city figure is higher than highway. | 18 |
| 13 | Engine text cut off at 63 characters by the source | 148 |
| 14 | Interior "colour" is a code or trim name (`Bk`, `Rb`, `B6x7`, `Interlagos`) | 8 |
| 15 | Duplicate listing (rows 84 and 85) | 1 |
| 16 | `photo` column empty | 687 |
| 17 | `price_inr` is always exactly `price_usd × 94.95`, so it's a calculated column | 687 |
| 18 | `used_vehicle = No` on cars with 1,000–100,000 miles | 291 |
| 19 | Real US dealership street addresses (conflicts with the region-neutral brief); 40 blank | 647 |

## 3. Corrections made

1. **Land Rover:** make set to `Land Rover`; `Rover ` removed from the model (12 records).
2. **Model / variant split:** a base `model` for filters (`3 Series`, `Grand Cherokee`, `Model Y`) and a `variant` for the trim. The full original model text is still in `title`.
3. **VINs recovered:** 42 VINs moved from the transmission and engine columns into a new `vin` field. The wrong column was set to `null`.
4. **Engine recovered:** 13 engine descriptions moved from `transmission` to `engine`, where `engine` was empty or held a code.
5. **Stock codes removed** from `engine` and set to `null` (35).
6. **Transmission standardised** to `Automatic` / `Manual` / `CVT` / `Dual-clutch`. The gear count goes in `gears` and the original text in `transmissionDetail`.
7. **Drivetrain standardised** to `AWD` / `FWD` / `RWD` / `4WD`.
8. **Placeholders** (`–`, `Other`) converted to `null`.
9. **Colours:** ALL-CAPS names changed to title case. A new `exteriorColorFamily` field drives the colour filter and the illustrations.
10. **Fuel type corrected from evidence inside the same record** (79 changes):
    - Diesel → Hybrid: 29
    - Diesel → Petrol: 22 (the engine text says GDI/MPFI/gasoline)
    - Diesel → Plug-in Hybrid: 17
    - Diesel → Electric: 5
    - Hybrid → Electric: 2
    - Petrol → Plug-in Hybrid: 2
    - Petrol → Hybrid: 1
    - Hybrid → Diesel: 1 (Jetta SportWagen **TDI**)

    New category: `Plug-in Hybrid` (e.g. BMW 530e, Volvo S90 Recharge T8, Porsche Cayenne E-Hybrid).
11. **Fuel type set to unknown** (30): the original label had no supporting evidence, e.g. a "Hybrid" 2024 Ford Explorer XLT or a "Diesel" 2014 Ford Focus. Flagged `fuelTypeConflict`.
12. **Fuel economy:** zero or implausible values set to `null` (38). Stored as `{min, max, unit}`, with unit `MPGe` for EVs.
13. **Duplicate removed:** row 85 (`ff48e725…`, 2020 INFINITI QX50 Luxe) is identical to row 84 (`a33f75fd…`) apart from ID and quantity. It is logged in `excluded-records.json`.
14. **Columns not carried into `cars.json`** (still in the raw CSV):
    - `price_inr`: calculated from the USD price; currency is now a setting.
    - `quantity`: each listing is a single used car.
    - `used_vehicle`: replaced by `condition: "Used"`, since every car has at least 1,001 miles.
    - `location`: replaced by an anonymised `sellerId`, so no real addresses or region appear in the demo.
15. **New fields:**
    - `stockNumber` (`CAR-0001`…)
    - `description`: built only from the record's own facts; nothing invented.
    - `listedAt`: a demo-only date for "Recently added".
    - `images`: see §6.

## 4. Unresolved issues (not changed; your decision needed if they matter)

| Issue | Records | Current handling |
|---|---|---|
| Fuel type unknown (label contradicted) | 30 | `null`. The UI shows "Not specified" and these cars are left out of fuel filters. |
| Petrol label not confirmed by the engine text | 125 | Kept as Petrol, flagged `fuelTypeUnconfirmed`. |
| Mileage looks synthetic: evenly spread from 1k to 100k regardless of age (e.g. a 2024 car with 98,196 mi) | 39 warnings | Kept as listed; the validator warns. |
| 2025 Honda Pilot with 61,142 mi; 1991 Dodge Stealth with 1,200 mi | 2 | Kept and flagged. |
| Transmission unknown | 83 | `null` |
| Engine unknown | 69 | `null` |
| Exterior / interior colour unknown | 43 / 64 | `null` |
| Colour family unknown (`Metallic`, `Pure`) | 2 | `null` (illustration uses a neutral colour) |
| Interior colour is a code | 8 | Kept as written, flagged |
| Engine text cut off by the source | 148 | Kept, flagged; the UI should show engine capacity instead |
| Doors, seats, condition grade, real descriptions | all | Not in the source; left `null` |
| `used_vehicle` meaning | 291 "No" | Unknown; not used |

## 5. Field completeness after cleaning (686 records)

| Field | Filled |
|---|---|
| make, model, year, price, mileage, bodyType | 100% |
| exteriorColorFamily | 93% |
| drivetrain | 95% |
| fuelType | 96% |
| engineCapacityL | 89% |
| transmission | 88% |
| fuelEconomy | 94% |
| horsepower | 6% |
| vin | 6% |

## 6. Images

The source has no photos, so every car now has an **original side-view illustration**:

- One drawing per body type and colour family, 70 SVG files in `public/images/cars/illustrations/`.
- Each image is tagged `kind: "illustration"`, its alt text says it isn't a photo of the vehicle, and each image carries a small "ILLUSTRATION" mark.

**Model photos (the second part of "Both") were not added.** This workspace's network policy blocks Wikimedia Commons, so I couldn't search or download free-licensed photos.

- The schema already supports them: `kind: "photo"` plus a required `credit`.
- They can be added later from a machine with internet access. Each photo would show the same model, not the actual listed car, and would need the author and licence credited.
