# Car Record Schema

File: `src/data/cars.json`. The file has the shape `{ "meta": {...}, "cars": [Car, ...] }`.

**Rule for every field:** `null` means *unknown*. It is never a guess. The UI shows "Not specified" for `null`, and the record's `dataFlags` say why a value is `null` or uncertain.

## `meta`

| Field | Type | Example | Notes |
|---|---|---|---|
| `generatedFrom` | string | `cars_categorized (2).csv` | The source file name. |
| `recordCountRaw` / `recordCount` | int | 687 / 686 | One duplicate was removed (see `data/reports/excluded-records.json`). |
| `priceCurrency` | string | `USD` | Currency of the `price` values. Display currency is a regional setting (Phase 3 config). |
| `mileageUnit` | string | `mi` | Unit of the `mileage` values. Showing km instead is a display setting. |

## `Car`

| Field | Type | Required | Allowed values / notes |
|---|---|---|---|
| `id` | string (UUID) | yes | Stable ID from the source. Used in URLs: `/cars/:id`. |
| `stockNumber` | string | yes | `CAR-0001`… Short, human-friendly reference. |
| `title` | string | yes | `"<year> <make> <full model>"`, e.g. `2022 Lexus IS 500 F SPORT Performance`. |
| `make` | string | yes | Brand, e.g. `Land Rover`, `Mercedes-Benz`. Official casing is kept (`INFINITI`, `MINI`, `smart`). |
| `model` | string | yes | Base model used for filters, e.g. `IS`, `3 Series`, `Grand Cherokee`. |
| `variant` | string \| null | | Trim/variant, e.g. `500 F SPORT Performance`. |
| `year` | int | yes | Model year. |
| `price` | number | yes | Value in `meta.priceCurrency`. |
| `mileage` | int | yes | Value in `meta.mileageUnit`. |
| `fuelType` | enum \| null | | `Petrol` `Diesel` `Hybrid` `Plug-in Hybrid` `Electric` |
| `transmission` | enum \| null | | `Automatic` `Manual` `CVT` `Dual-clutch` |
| `transmissionDetail` | string \| null | | Original text, e.g. `8-Speed Automatic with Tiptronic`. |
| `gears` | int \| null | | Taken from `transmissionDetail` where it states the number of gears. |
| `drivetrain` | enum \| null | | `AWD` `FWD` `RWD` `4WD` |
| `bodyType` | enum | yes | `SUV` `Sedan` `Coupe` `Truck` `Hatchback` `Wagon` `Convertible` `Minivan` `Van` |
| `engine` | string \| null | | Engine description as listed. |
| `engineCapacityL` | number \| null | | Litres, taken from `engine`. Always `null` for electric vehicles. |
| `horsepower` | int \| null | | Only where the source states it. |
| `exteriorColor` | string \| null | | Manufacturer colour name, e.g. `Soul Red Crystal Metallic`. |
| `exteriorColorFamily` | enum \| null | | `Black` `White` `Gray` `Silver` `Blue` `Red` `Green` `Brown` `Beige` `Orange` `Yellow` `Purple`. Used for the colour filter and the illustrations. |
| `interiorColor` | string \| null | | |
| `doors`, `seats` | int \| null | | Not in the source, so always `null` for now. |
| `condition` | enum | yes | `Used` (also allowed: `New`, `Certified Pre-Owned`). |
| `accidentHistory` | enum | | `none-reported` \| `reported` |
| `fuelEconomy` | object \| null | | `{ min, max, unit }`. `unit` is `mpg` or `MPGe` (electric). |
| `vin` | string \| null | | 17-character VIN, recovered where it had been entered in the wrong column. |
| `sellerId` | string \| null | | Anonymised seller, e.g. `SELLER-001`. Street addresses are not published. |
| `description` | string | | Built only from this record's own fields. `descriptionSource` is `generated-from-record`. |
| `images` | Image[] | yes | See below. |
| `listingStatus` | enum | yes | `available` `reserved` `sold` `draft` |
| `listedAt` | `YYYY-MM-DD` | | **Demo-only date**, used for "Recently added". It is not from the source. |
| `dataFlags` | string[] | | Data quality warnings for this record (see below). |
| `sourceRow` | int | | Line number in the original CSV, so you can trace the record back. |

### `Image`

```json
{ "src": "/images/cars/illustrations/sedan-gray.svg",
  "alt": "Illustration of a sedan in Gray — not a photo of this 2022 Lexus IS 500 …",
  "kind": "illustration",          // or "photo"
  "credit": null }                 // required for third-party photos: author + licence
```

The UI must show an "Illustrative image" label whenever `kind` is `illustration`.

### `dataFlags`

| Flag | Meaning |
|---|---|
| `fuelTypeUnconfirmed` | Labelled Petrol in the source, but nothing in the name or engine confirms it. Kept as Petrol. |
| `fuelTypeConflict` | The source label (Diesel/Hybrid/Electric) is contradicted or unsupported, so it is set to `null`. |
| `engineTextTruncated` | The source cut the engine text off at 63 characters. |
| `interiorColorIsCode` | The interior colour is a code or trim name (`Bk`, `B6x7`, `Interlagos`), not a colour. |
| `exteriorColorFamilyUnknown` | The colour name (`Metallic`, `Pure`) can't be mapped to a colour family. |
| `highMileageForYear` / `lowMileageForAge` | Mileage that is unusual for the car's age. Kept as listed. |

## Validation rules

They are written in code in `src/utils/validateCar.js`. Run `node data/cleaning/check_dataset.mjs` to check the whole dataset.

**Errors (the record is rejected):**

- A required field is missing.
- `year` is not between 1980 and the current year + 1.
- `price` is not between 500 and 2,000,000.
- `mileage` is negative, not a whole number, or over 500,000.
- `engineCapacityL` is not between 0.6 and 8.5.
- A value is outside its allowed list.
- An electric car has an engine capacity.
- `fuelEconomy.min` is greater than `fuelEconomy.max`.
- `vin` is not 17 valid characters.
- `listedAt` is not an ISO date.
- An image has no `src` or `alt`, or its `kind` is invalid.
- A third-party photo has no credit.

**Warnings (the record is kept):**

- Mileage is more than 40,000 a year for the car's age.
- The title doesn't start with year + make.
- The record has no images.
- An electric car's economy is given in `mpg`.
