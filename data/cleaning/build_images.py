"""
build_images.py — draws an original side-view illustration for every
(bodyType, exteriorColorFamily) combination and links each car to it.

These are ILLUSTRATIONS, not photographs of the listed vehicles. Each image
entry in cars.json carries kind="illustration" so the UI can label it.

Usage (from the project root, after clean_inventory.py):
    python data/cleaning/build_images.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CARS_JSON = ROOT / "src" / "data" / "cars.json"
OUT_DIR = ROOT / "public" / "images" / "cars" / "illustrations"
PUBLIC_PREFIX = "/images/cars/illustrations"

W, H, GROUND = 800, 450, 372
WHEEL_R = 44

COLORS = {
    "Black": "#24282e", "White": "#f2f4f6", "Gray": "#7a8089", "Silver": "#bcc1c7",
    "Blue": "#2d5a9a", "Red": "#b0262f", "Green": "#3e6a4b", "Brown": "#6c4a34",
    "Beige": "#cbb690", "Orange": "#d4752a", "Yellow": "#ddb22e", "Purple": "#5b3a78",
    "Unspecified": "#98a1ab",
}

# Profile parameters per body type (car faces left).
# x0/x1: front/rear extremes, belt: shoulder line, roof: roof height,
# hood: hood length, rake: windshield run, roofLen: flat roof length,
# rear: shape of the back, clear: ground clearance, wf/wr: wheel centres.
BODIES = {
    "Sedan":       dict(x0=95,  x1=705, belt=268, roof=176, hood=165, rake=95, roofLen=150, rear="trunk",  clear=24, wf=225, wr=575),
    "Coupe":       dict(x0=100, x1=700, belt=272, roof=190, hood=180, rake=110, roofLen=95, rear="fastback", clear=20, wf=228, wr=572),
    "Convertible": dict(x0=100, x1=700, belt=272, roof=232, hood=185, rake=55, roofLen=0, rear="open",   clear=20, wf=228, wr=572),
    "Hatchback":   dict(x0=125, x1=675, belt=262, roof=168, hood=130, rake=95, roofLen=170, rear="hatch",  clear=26, wf=235, wr=560),
    "Wagon":       dict(x0=95,  x1=705, belt=264, roof=172, hood=160, rake=95, roofLen=255, rear="hatch",  clear=26, wf=225, wr=578),
    "SUV":         dict(x0=95,  x1=705, belt=250, roof=150, hood=150, rake=80, roofLen=270, rear="hatch",  clear=40, wf=225, wr=575),
    "Minivan":     dict(x0=90,  x1=710, belt=250, roof=140, hood=110, rake=115, roofLen=315, rear="hatch", clear=30, wf=215, wr=580),
    "Van":         dict(x0=85,  x1=715, belt=245, roof=110, hood=85,  rake=70,  roofLen=420, rear="box",   clear=34, wf=200, wr=590),
    "Truck":       dict(x0=80,  x1=720, belt=246, roof=152, hood=150, rake=70,  roofLen=150, rear="bed",   clear=44, wf=210, wr=590),
}


def shade(hex_color, factor):
    """factor < 1 darkens, > 1 lightens."""
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    if factor >= 1:
        r, g, b = (int(c + (255 - c) * (factor - 1)) for c in (r, g, b))
    else:
        r, g, b = (int(c * factor) for c in (r, g, b))
    return f"#{r:02x}{g:02x}{b:02x}"


def body_path(p):
    x0, x1, belt, roof = p["x0"], p["x1"], p["belt"], p["roof"]
    bottom = GROUND - p["clear"]
    ws_base = x0 + p["hood"]
    ws_top = ws_base + p["rake"]
    roof_end = ws_top + p["roofLen"]
    d = [f"M{x0 + 14},{bottom}",
         f"Q{x0 - 4},{bottom} {x0},{belt + 40}",          # front bumper
         f"Q{x0 + 2},{belt + 4} {x0 + 40},{belt - 2}",     # nose
         f"L{ws_base},{belt - 14}"]                        # hood
    rear = p["rear"]
    if rear == "open":
        d += [f"L{x1 - 30},{belt - 18}", f"Q{x1 - 2},{belt - 16} {x1},{belt + 18}"]
    else:
        d += [f"Q{ws_base + p['rake'] * 0.55},{roof + 8} {ws_top},{roof}",  # windshield
              f"L{roof_end},{roof}"]                                          # roof
        if rear == "trunk":
            deck = x1 - 105
            d += [f"Q{roof_end + 55},{roof + 8} {deck},{belt - 22}", f"L{x1 - 22},{belt - 20}",
                  f"Q{x1 - 2},{belt - 16} {x1},{belt + 18}"]
        elif rear == "fastback":
            d += [f"Q{roof_end + 120},{roof + 20} {x1 - 40},{belt - 20}",
                  f"Q{x1 - 2},{belt - 16} {x1},{belt + 18}"]
        elif rear == "hatch":
            d += [f"Q{x1 - 8},{roof + 2} {x1 - 6},{roof + 40}", f"L{x1},{belt + 18}"]
        elif rear == "box":
            d += [f"Q{x1 - 2},{roof} {x1},{roof + 22}", f"L{x1},{belt + 18}"]
        elif rear == "bed":
            d += [f"L{roof_end + 12},{roof + 8}", f"L{roof_end + 14},{belt - 14}",
                  f"L{x1 - 6},{belt - 14}", f"L{x1},{belt + 18}"]
    d += [f"Q{x1 + 2},{bottom} {x1 - 16},{bottom}", "Z"]
    return " ".join(d)


def window_path(p):
    rear = p["rear"]
    belt, roof = p["belt"], p["roof"]
    if rear == "open":
        ws_base = p["x0"] + p["hood"]
        return (f"M{ws_base},{belt - 14} L{ws_base + p['rake']},{roof - 6} L{ws_base + p['rake'] + 16},{roof - 6} "
                f"L{ws_base + 44},{belt - 14} Z")
    ws_base = p["x0"] + p["hood"]
    ws_top = ws_base + p["rake"]
    roof_end = ws_top + p["roofLen"]
    y_bot = belt - 20
    sx = ws_base + 22
    pts = [f"M{sx},{y_bot}", f"Q{ws_base + p['rake'] * 0.6},{roof + 16} {ws_top + 6},{roof + 10}",
           f"L{roof_end - 4},{roof + 10}"]
    if rear == "trunk":
        pts += [f"Q{roof_end + 40},{roof + 16} {roof_end + 62},{y_bot}"]
    elif rear == "fastback":
        pts += [f"Q{roof_end + 70},{roof + 22} {roof_end + 105},{y_bot}"]
    elif rear == "box":
        # cargo van: glass only around the cab, so replace the long roof run
        pts[-1] = f"L{ws_top + 120},{roof + 10}"
        pts += [f"L{ws_top + 120},{y_bot}"]
    elif rear == "hatch":
        pts += [f"L{p['x1'] - 26},{roof + 12}", f"Q{p['x1'] - 18},{roof + 18} {p['x1'] - 18},{roof + 40}",
                f"L{p['x1'] - 22},{y_bot}"]
    elif rear == "bed":
        pts += [f"L{roof_end + 2},{roof + 12}", f"L{roof_end + 2},{y_bot}"]
    pts.append("Z")
    return " ".join(pts)


def pillar_xs(p):
    """x positions of the B (and C) pillars dividing the side glass."""
    ws_top = p["x0"] + p["hood"] + p["rake"]
    roof_end = ws_top + p["roofLen"]
    if p["rear"] == "open":
        return []
    if p["rear"] in ("trunk", "fastback"):
        return [ws_top + p["roofLen"] * 0.5]
    if p["rear"] == "bed":
        return [ws_top + p["roofLen"] * 0.52]
    span = (p["x1"] - 22) - ws_top
    if p["rear"] == "box":
        return [ws_top + 40]
    return [ws_top + span * 0.38, ws_top + span * 0.72]


def wheel(cx, rim):
    cy = GROUND - WHEEL_R
    spokes = "".join(
        f'<rect x="{cx - 3}" y="{cy - WHEEL_R * 0.58}" width="6" height="{WHEEL_R * 0.58}" rx="3" '
        f'fill="{rim}" transform="rotate({a} {cx} {cy})"/>' for a in range(0, 360, 72))
    return (f'<circle cx="{cx}" cy="{cy}" r="{WHEEL_R}" fill="#1b1d21"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{WHEEL_R * 0.66}" fill="#2c3036"/>'
            f'{spokes}'
            f'<circle cx="{cx}" cy="{cy}" r="{WHEEL_R * 0.62}" fill="none" stroke="{rim}" stroke-width="4"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{WHEEL_R * 0.16}" fill="{rim}"/>')


def svg_for(body, family):
    p = BODIES[body]
    base = COLORS[family]
    light, dark = shade(base, 1.28), shade(base, 0.7)
    outline = shade(base, 0.55) if family not in ("Black",) else "#0e1013"
    belt = p["belt"]
    wheel_y = GROUND - WHEEL_R
    win = window_path(p)
    pillars = "".join(
        f'<rect x="{x - 5}" y="{p["roof"] + 6}" width="10" height="{belt - p["roof"] - 24}" fill="{dark}"/>'
        for x in pillar_xs(p))
    door_x = pillar_xs(p)[0] if pillar_xs(p) else p["x0"] + p["hood"] + 120
    title = f"Illustration of a {family.lower()} {body.lower()}" if family != "Unspecified" else f"Illustration of a {body.lower()}"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{title}">
  <title>{title} (not a photo of the listed vehicle)</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6f8fb"/><stop offset="1" stop-color="#e3e8ef"/>
    </linearGradient>
    <linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{light}"/><stop offset="0.45" stop-color="{base}"/><stop offset="1" stop-color="{dark}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5d6f84"/><stop offset="1" stop-color="#1f2a36"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#bg)"/>
  <ellipse cx="{W / 2}" cy="{GROUND + 6}" rx="{(p['x1'] - p['x0']) / 2 + 20}" ry="14" fill="#000" opacity="0.12"/>
  <path d="{body_path(p)}" fill="url(#paint)" stroke="{outline}" stroke-width="2.5" stroke-linejoin="round"/>
  {f'<path d="{win}" fill="url(#glass)"/>' if win else ''}
  {pillars}
  {f'<path d="M{p["x0"] + p["hood"] + 40},{p["belt"] - 16} q60,-26 150,-22 q30,0 40,22 z" fill="#1d2228"/>' if p["rear"] == "open" else ''}
  <path d="M{p['x0'] + 30},{belt + 6} L{p['x1'] - 30},{belt + 6}" stroke="{light}" stroke-width="2" opacity="0.7"/>
  <line x1="{door_x}" y1="{belt - 18}" x2="{door_x + 6}" y2="{GROUND - p['clear'] - 6}" stroke="{outline}" stroke-width="1.5" opacity="0.6"/>
  <rect x="{door_x - 46}" y="{belt + 14}" width="26" height="6" rx="3" fill="{outline}" opacity="0.6"/>
  <rect x="{door_x + 34}" y="{belt + 14}" width="26" height="6" rx="3" fill="{outline}" opacity="0.6"/>
  <path d="M{p['x0'] + 6},{belt + 14} q14,-10 40,-8 l-4,12 q-20,2 -36,4 z" fill="#fff6d8" stroke="{outline}" stroke-width="1.5"/>
  <rect x="{p['x1'] - 12}" y="{belt + 4}" width="10" height="20" rx="3" fill="#c0262d"/>
  <path d="M{p['x0'] + 30},{GROUND - p['clear'] - 6} L{p['x1'] - 30},{GROUND - p['clear'] - 6}" stroke="{dark}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <circle cx="{p['wf']}" cy="{wheel_y}" r="{WHEEL_R + 9}" fill="#15171a"/>
  <circle cx="{p['wr']}" cy="{wheel_y}" r="{WHEEL_R + 9}" fill="#15171a"/>
  {wheel(p['wf'], '#c9ced5')}
  {wheel(p['wr'], '#c9ced5')}
  <text x="{W - 16}" y="{H - 14}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#6b7480" letter-spacing="1.5">ILLUSTRATION</text>
</svg>
'''


def main():
    data = json.loads(CARS_JSON.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    made = set()
    for car in data["cars"]:
        body = car["bodyType"] if car["bodyType"] in BODIES else "Sedan"
        family = car["exteriorColorFamily"] or "Unspecified"
        slug = f"{body.lower()}-{family.lower()}.svg"
        if slug not in made:
            (OUT_DIR / slug).write_text(svg_for(body, family), encoding="utf-8")
            made.add(slug)
        colour_text = car["exteriorColor"] or "unspecified colour"
        car["images"] = [{
            "src": f"{PUBLIC_PREFIX}/{slug}",
            "alt": f"Illustration of a {car['bodyType'].lower()} in {colour_text} — not a photo of this {car['title']}",
            "kind": "illustration",
            "credit": None,
        }]
    CARS_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(made)} illustrations written, {len(data['cars'])} cars linked")


if __name__ == "__main__":
    main()
