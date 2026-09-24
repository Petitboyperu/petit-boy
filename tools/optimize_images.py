"""One-time preparation of the illustrative menu photos."""

from pathlib import Path
from PIL import Image


SOURCE = Path(r"C:\Users\iamjs\.codex\generated_images\01a0437a-c9fd-73a1-9252-b45392d88737")
DEST = Path(__file__).resolve().parents[1] / "assets" / "products"
IMAGES = {
    "trufa-avellana": "exec-54a3abbb-4135-4638-a2da-eee4cb92c494.png",
    "trufa-pisco": "exec-60f5e1dc-4d50-4ace-b049-a391d1a1de69.png",
    "trufa-chocolate-blanco": "exec-caf2a5e0-d014-4ca2-8360-721f2daebd9e.png",
    "trufa-baileys": "exec-a699574a-acac-491e-921f-408a7acc8e75.png",
    "beso-oreo": "exec-f2822d32-4ccb-46d3-89a0-a9c95766676a.png",
    "trufa-carrot-cake": "exec-4c7a46de-71e6-4354-8a27-b3580e5ec3ed.png",
    "keke-platano-pecanas": "exec-a353f12a-64c4-4e71-93de-ab7c1e303520.png",
    "keke-zanahoria": "exec-68ef0930-4a36-4b78-8aa6-df57427a22a5.png",
    "brownie": "exec-141b0fd8-da6d-4771-b34d-88407132cecf.png",
    "galleta-mm": "exec-373995c9-f057-40c3-94e3-163c7749c6de.png",
    "galleta-almendras": "exec-1b1a9e3e-214f-4cfb-bc12-98041b765c2a.png",
    "alfajor-manjar": "exec-2c5af781-1a12-405a-93f1-cf0ac38fe544.png",
    "alfajor-cheesecake-arandanos": "exec-1c4035a2-eb92-4294-8478-fd7e17e91ba4.png",
    "alfajor-manjar-frambuesas": "exec-9e0a19d7-2ac1-4b7b-ae0d-34d5af9db94c.png",
    "pie-limon": "exec-0b0814a4-25ac-4667-8d07-2b82bea69f3e.png",
    "pie-pera": "exec-e3ad7c79-4a89-4a3a-b618-98e4d2694b05.png",
    "pie-manzana": "exec-5b2937c2-b740-43df-9fc3-9077b9600742.png",
    "pie-pecanas": "exec-6f4347b6-f015-4a6a-a33d-f1bb437f5354.png",
    "pie-nueces": "exec-bc87b77b-5dde-4d73-9cbf-64e85c18ff0e.png",
    "tres-leches": "exec-8dd5aa8a-5d9a-4b24-bc53-4811dd9e5120.png",
    "cheesecake-frambuesa": "exec-699cff82-a17a-4431-b046-38894d365c8d.png",
    "cheesecake-oreo": "exec-e8dd87cd-4509-4a96-8e24-0388e23abf70.png",
    "tarta-queso-arandanos": "exec-1801a394-c9da-433a-abfc-3f85bfc00220.png",
    "torta-chocolate": "exec-cbda8010-d34e-4c97-bb97-779e61dffd7f.png",
    "carrot-cake": "exec-8d52f9df-e449-4f70-93bc-72d3d0426d7e.png",
    "crema-volteada": "exec-dcf51f82-c716-4c24-8661-33ea6ce55370.png",
    "mousse-chocolate-53": "exec-22e463c3-037c-4f0d-b8e8-43c6bf483476.png",
}

DEST.mkdir(parents=True, exist_ok=True)
for name, source_name in IMAGES.items():
    source = SOURCE / source_name
    if not source.exists():
        raise FileNotFoundError(source)
    with Image.open(source) as image:
        image = image.convert("RGB")
        image.thumbnail((800, 800))
        image.save(DEST / f"{name}.webp", "WEBP", quality=83, method=6)

root = DEST.parent
with Image.open(root / "logo.png") as logo:
    for size in (192, 512):
        icon = logo.convert("RGBA")
        icon.thumbnail((size, size))
        icon.save(root / f"icon-{size}.png", optimize=True)

print(f"Prepared {len(IMAGES)} product images and two app icons.")
