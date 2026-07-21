#!/usr/bin/env python3
"""Synchronize the static global navigation across user-facing pages."""

from __future__ import annotations

import argparse
import html
import re
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HEADER_START = "<!-- SITE_HEADER_START -->"
HEADER_END = "<!-- SITE_HEADER_END -->"


@dataclass(frozen=True)
class NavLink:
    label: str
    href: str


@dataclass(frozen=True)
class NavSection:
    key: str
    label: str
    href: str
    icon: str
    summary: str
    menu_id: str
    menu_class: str
    links: tuple[NavLink, ...]


NAV_SECTIONS: tuple[NavSection, ...] = (
    NavSection(
        key="platform",
        label="Platform",
        href="platform/",
        icon="Layers3",
        summary="See how HRX systems, AI, Insights, and support work as one platform.",
        menu_id="nav-platform-menu",
        menu_class="nav-menu--platform",
        links=(
            NavLink("Overview", "platform/"),
            NavLink("AI Image Analysis", "platform/ai-image-analysis/"),
            NavLink("Managed Service & Support", "platform/managed-service-support/"),
            NavLink("Application Fit & Validation", "platform/application-fit-validation/"),
        ),
    ),
    NavSection(
        key="applications",
        label="Applications",
        href="applications/",
        icon="ScanSearch",
        summary="Start with the inspection, quality, traceability, or production question.",
        menu_id="nav-applications-menu",
        menu_class="nav-menu--applications",
        links=(
            NavLink("Overview", "applications/"),
            NavLink("Foreign Material Detection", "applications/foreign-material-detection/"),
            NavLink("Product Quality & Package Integrity", "applications/product-quality-package-integrity/"),
            NavLink("Weight & Count Intelligence", "applications/weight-count-intelligence/"),
            NavLink("Traceability & QA Review", "applications/traceability-qa-review/"),
            NavLink("Production Analytics", "applications/production-analytics/"),
        ),
    ),
    NavSection(
        key="insights",
        label="Insights Software",
        href="insights/",
        icon="LayoutDashboard",
        summary="Review images, events, alerts, and machine context in one software layer.",
        menu_id="nav-insights-menu",
        menu_class="nav-menu--insights",
        links=(
            NavLink("Overview", "insights/"),
            NavLink("Image History & Event Review", "insights/image-history-event-review/"),
            NavLink("Beyond Rejects", "insights/beyond-rejects/"),
            NavLink("Machine Visibility & Alerts", "insights/machine-visibility-alerts/"),
            NavLink("Enterprise Access", "insights/enterprise-access/"),
        ),
    ),
    NavSection(
        key="systems",
        label="Inspection Systems",
        href="machines/",
        icon="ScanLine",
        summary="Compare HRX systems, technical specifications, and line fit.",
        menu_id="nav-systems-menu",
        menu_class="nav-menu--systems",
        links=(
            NavLink("HRX Systems", "machines/"),
            NavLink("Compare HRX Models", "machines/#comparison"),
            NavLink("Spec Sheets", "inspection-systems/spec-sheets/"),
            NavLink("Talk Through Fit", "contact/"),
        ),
    ),
    NavSection(
        key="industries",
        label="Industries",
        href="industries/",
        icon="Factory",
        summary="Explore application fit by food and beverage category.",
        menu_id="nav-industries-menu",
        menu_class="nav-menu--industries",
        links=(
            NavLink("Overview", "industries/"),
            NavLink("Protein", "industries/protein/"),
            NavLink("Dairy & Cheese", "industries/dairy-cheese/"),
            NavLink("Frozen & Prepared Foods", "industries/frozen-prepared-foods/"),
            NavLink("Pet Food", "industries/pet-food/"),
            NavLink("Produce", "industries/produce/"),
            NavLink("Seafood", "industries/seafood/"),
            NavLink("Beverage & Packaged Goods", "industries/beverage-packaged-goods/"),
        ),
    ),
    NavSection(
        key="case-studies",
        label="Case Studies",
        href="resources/case-studies/",
        icon="FileCheck2",
        summary="See image-backed proof from application-specific production challenges.",
        menu_id="nav-case-studies-menu",
        menu_class="nav-menu--case-studies",
        links=(
            NavLink("All Case Studies", "resources/case-studies/"),
            NavLink("Bone Detection", "resources/case-studies/bone-detection/"),
            NavLink("Product-in-Seal", "resources/case-studies/product-in-seal/"),
            NavLink("Dent Detection", "resources/case-studies/dent-detection/"),
        ),
    ),
)

CTA = NavLink("Request a Demo", "contact/")

ICONS = {
    "Menu": '<svg class="nav-toggle__icon nav-toggle__icon--menu" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
    "X": '<svg class="nav-toggle__icon nav-toggle__icon--close" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    "ChevronDown": '<svg class="nav-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    "ArrowRight": '<svg class="nav-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    "Layers3": '<svg class="nav-menu__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>',
    "ScanSearch": '<svg class="nav-menu__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="11" cy="11" r="3"/><path d="m16 16-2.2-2.2"/></svg>',
    "LayoutDashboard": '<svg class="nav-menu__icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    "ScanLine": '<svg class="nav-menu__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
    "Factory": '<svg class="nav-menu__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20h20"/><path d="M4 20V9l5 3V9l5 3V4h4v16"/><path d="M8 16h1"/><path d="M13 16h1"/></svg>',
    "FileCheck2": '<svg class="nav-menu__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>',
}

HEADER_MARKER_RE = re.compile(
    rf"{re.escape(HEADER_START)}.*?{re.escape(HEADER_END)}", re.DOTALL
)
HEADER_RE = re.compile(r"<header\s+class=\"site-header\"[^>]*>.*?</header>", re.DOTALL)


def route_for_file(path: Path) -> str:
    rel = path.relative_to(ROOT)
    if rel.name == "index.html":
        parent = rel.parent.as_posix()
        return "" if parent == "." else f"{parent}/"
    return rel.as_posix()


def root_prefix(path: Path) -> str:
    depth = len(path.relative_to(ROOT).parent.parts)
    return "./" if depth == 0 else "../" * depth


def normalize_route(route: str) -> str:
    clean = route.split("#", 1)[0].split("?", 1)[0]
    clean = clean.lstrip("/")
    if clean.endswith("index.html"):
        clean = clean[: -len("index.html")]
    return clean.rstrip("/")


def href(prefix: str, route: str) -> str:
    return f"{prefix}{route}" if route else prefix


def attrs(items: dict[str, str | bool]) -> str:
    rendered = []
    for key, value in items.items():
        if value is False or value is None:
            continue
        if value is True:
            rendered.append(key)
        else:
            rendered.append(f'{key}="{html.escape(str(value), quote=True)}"')
    return "" if not rendered else " " + " ".join(rendered)


def section_is_current(section: NavSection, current: str) -> bool:
    section_base = normalize_route(section.href)
    if current == section_base or current.startswith(f"{section_base}/"):
        return True
    for link in section.links:
        link_base = normalize_route(link.href)
        if "#" not in link.href and current == link_base:
            return True
    return False


def link_is_current(link: NavLink, current: str) -> bool:
    return "#" not in link.href and normalize_route(link.href) == current


def render_header(path: Path) -> str:
    prefix = root_prefix(path)
    current = normalize_route(route_for_file(path))
    lines = [
        HEADER_START,
        '<header class="site-header" data-site-header>',
        '  <nav class="nav" aria-label="Primary">',
        f'    <a class="brand" href="{href(prefix, "")}" aria-label="GreyscaleAI home"><img src="{prefix}assets/img/logos/greyscale-ai-logo-white.png" alt="GreyscaleAI"></a>',
        f'    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open navigation" data-nav-toggle>{ICONS["Menu"]}{ICONS["X"]}</button>',
        '    <ul class="nav-links" id="primary-navigation" data-nav-links>',
    ]

    for section in NAV_SECTIONS:
        is_section_current = section_is_current(section, current)
        li_class = "nav-item has-menu" + (" is-current-section" if is_section_current else "")
        lines.append(f'      <li class="{li_class}" data-nav-item data-nav-section="{section.key}">')
        lines.append('        <div class="nav-item__topline">')
        top_attrs = {"class": "nav-link", "href": href(prefix, section.href)}
        if normalize_route(section.href) == current:
            top_attrs["aria-current"] = "page"
        lines.append(f"          <a{attrs(top_attrs)}>{html.escape(section.label)}</a>")
        lines.append(
            f'          <button class="nav-submenu-toggle" type="button" aria-expanded="false" aria-controls="{section.menu_id}" aria-label="Open {html.escape(section.label, quote=True)} menu" data-nav-submenu-toggle>{ICONS["ChevronDown"]}</button>'
        )
        lines.append("        </div>")
        lines.append(f'        <div class="nav-menu {section.menu_class}" id="{section.menu_id}" data-nav-menu>')
        lines.append("          <div class=\"nav-menu__intro\">")
        lines.append(f"            {ICONS[section.icon]}")
        lines.append(f"            <p>{html.escape(section.summary)}</p>")
        lines.append("          </div>")
        lines.append('          <ul class="nav-menu__links">')
        for index, link in enumerate(section.links):
            link_attrs = {"href": href(prefix, link.href)}
            classes = []
            if index == 0 and normalize_route(section.href) == current:
                classes.append("is-current-page")
            elif link_is_current(link, current):
                link_attrs["aria-current"] = "page"
            if classes:
                link_attrs["class"] = " ".join(classes)
            lines.append(f"            <li><a{attrs(link_attrs)}><span>{html.escape(link.label)}</span>{ICONS['ArrowRight']}</a></li>")
        lines.append("          </ul>")
        lines.append("        </div>")
        lines.append("      </li>")

    cta_attrs = {"class": "nav-cta", "href": href(prefix, CTA.href)}
    if normalize_route(CTA.href) == current:
        cta_attrs["aria-current"] = "page"
    lines.append(f"      <li><a{attrs(cta_attrs)}>{html.escape(CTA.label)}</a></li>")
    lines.extend(["    </ul>", "  </nav>", "</header>", HEADER_END])
    return "\n".join(lines)


def html_files() -> list[Path]:
    skipped = {".git", ".agents", ".codex", "node_modules", "output", "tmp"}
    files = []
    for path in ROOT.rglob("*.html"):
        if any(part in skipped for part in path.relative_to(ROOT).parts):
            continue
        files.append(path)
    return sorted(files)


def replace_header(path: Path, content: str) -> tuple[str, bool]:
    header = render_header(path)
    marked = HEADER_MARKER_RE.search(content)
    if marked:
        return HEADER_MARKER_RE.sub(header, content, count=1), True
    legacy = HEADER_RE.search(content)
    if legacy:
        return HEADER_RE.sub(header, content, count=1), True
    return content, False


def route_exists(route: str) -> bool:
    base, _, anchor = route.partition("#")
    base_path = ROOT / base
    target = base_path / "index.html" if base.endswith("/") else base_path
    if not target.exists():
        return False
    if anchor:
        content = target.read_text()
        return f'id="{anchor}"' in content or f"id='{anchor}'" in content
    return True


def validate_routes() -> list[str]:
    errors = []
    routes = [section.href for section in NAV_SECTIONS]
    routes.extend(link.href for section in NAV_SECTIONS for link in section.links)
    routes.append(CTA.href)
    for route in sorted(set(routes)):
        if not route_exists(route):
            errors.append(f"Missing configured route or anchor: {route}")

    spec_count = sum(
        1
        for section in NAV_SECTIONS
        if section.label == "Spec Sheets" or any(link.label == "Spec Sheets" for link in section.links)
    )
    if spec_count > 1:
        errors.append("More than one top-level Spec Sheets item is configured.")
    return errors


def run(write: bool) -> int:
    changed = []
    drift = []

    for path in html_files():
        content = path.read_text()
        updated, had_header = replace_header(path, content)
        if not had_header:
            continue
        if updated != content:
            rel = path.relative_to(ROOT).as_posix()
            if write:
                path.write_text(updated)
                changed.append(rel)
            else:
                drift.append(rel)
        elif HEADER_START not in content:
            drift.append(path.relative_to(ROOT).as_posix())

    errors = validate_routes()

    if write and changed:
        print("Updated global navigation:")
        for rel in changed:
            print(f"  {rel}")
    if not write and drift:
        print("Global navigation drift detected:")
        for rel in drift:
            print(f"  {rel}")
    for error in errors:
        print(error)

    return 1 if drift or errors else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Rewrite page headers from canonical nav data.")
    mode.add_argument("--check", action="store_true", help="Check that generated headers and configured routes are current.")
    args = parser.parse_args()
    return run(write=args.write)


if __name__ == "__main__":
    sys.exit(main())
