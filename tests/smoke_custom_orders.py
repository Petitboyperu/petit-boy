"""Smoke test for the personalized orders flow on the local static server."""

from datetime import date, timedelta
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright


ROOT = "http://127.0.0.1:8000/"
SCREENSHOTS = Path(__file__).resolve().parent / "screenshots"


def run() -> None:
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(ROOT)
        page.wait_for_load_state("networkidle")

        section = page.locator("#personalizados")
        assert section.get_by_role("heading", name="Tortas Personalizadas Para momentos especiales").is_visible()
        assert section.locator("img").evaluate("image => image.complete && image.naturalWidth > 0")
        form = page.locator("#custom-order-form")
        minimum = form.locator('[name="eventDate"]').get_attribute("min")
        assert minimum == (date.today() + timedelta(days=3)).isoformat()

        form.locator('[name="orderType"]').select_option(label="Torta temática")
        assert form.locator('[name="base"]').get_attribute("required") is not None
        assert form.locator('[name="filling"]').get_attribute("required") is not None
        form.locator('[name="size"]').select_option(label="20-30 porciones")
        form.locator('[name="base"]').select_option(label="Chocolate")
        form.locator('[name="filling"]').select_option(label="Manjar de olla")
        form.locator('[name="occasion"]').select_option(label="Cumpleaños")
        form.locator('[name="customerName"]').fill("Ana")
        form.locator('[name="notes"]').fill("Flores rosadas y mensaje Feliz cumple")
        form.locator('[name="eventDate"]').fill(date.today().isoformat())
        assert not form.locator('[name="eventDate"]').evaluate("field => field.checkValidity()")

        form.locator('[name="eventDate"]').fill(minimum)
        with page.expect_popup() as opened:
            form.get_by_role("button", name="Cotizar por WhatsApp").click()
        popup = opened.value
        popup.wait_for_load_state("domcontentloaded")
        url = urlparse(page.locator("#custom-order-whatsapp-link").get_attribute("href"))
        assert url.netloc == "wa.me" and url.path == "/51967657766"
        message = parse_qs(url.query)["text"][0]
        for part in (
            "Torta temática",
            "Chocolate",
            "Manjar de olla",
            "20-30 porciones",
            "Cumpleaños",
            "Flores rosadas y mensaje Feliz cumple",
            "Nombre: Ana",
        ):
            assert part in message, part
        popup.close()

        page.locator("#personalizados").screenshot(path=str(SCREENSHOTS / "desktop.png"))
        page.get_by_role("button", name="+ Agregar").first.click()
        assert page.locator("#header-count").inner_text() == "1"

        mobile = browser.new_page(viewport={"width": 375, "height": 812}, is_mobile=True)
        mobile.goto(ROOT)
        mobile.wait_for_load_state("networkidle")
        mobile.locator("#personalizados").screenshot(path=str(SCREENSHOTS / "mobile.png"))
        assert mobile.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert not errors, errors
        browser.close()


if __name__ == "__main__":
    run()
    print("custom orders smoke test: OK")
