from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


MODELS = [
    {
        "model": "HRX660",
        "opening": "639 x 254 mm",
        "speed": "Up to 60 m/min",
        "washdown": "Standard",
        "cabinet": "IP66",
        "applications": "Protein, dairy blocks, packaged frozen foods",
        "notes": "Large inspection width for broad belts and high-throughput product formats.",
    },
    {
        "model": "HRX660AQ",
        "opening": "596 x 225 mm",
        "speed": "Up to 60 m/min",
        "washdown": "Hygienic washdown",
        "cabinet": "IP69K",
        "applications": "Protein, dairy blocks, frozen packaged foods, grading workflows",
        "notes": "Washdown-ready version for hygienic environments that still need wide-belt coverage.",
    },
    {
        "model": "HRX508AQ",
        "opening": "452 x 175 mm",
        "speed": "Up to 60 m/min",
        "washdown": "Hygienic washdown",
        "cabinet": "IP69K",
        "applications": "Tray-packed proteins, dairy formats, frozen packaged foods",
        "notes": "Mid-width washdown system suited to packaged products and mixed-format production.",
    },
    {
        "model": "HRX380",
        "opening": "329 x 102 mm",
        "speed": "Up to 80 m/min",
        "washdown": "Standard",
        "cabinet": "IP66",
        "applications": "Packaged foods, cheese, compact lines",
        "notes": "Compact standard-cabinet system for space-constrained lines with faster belt speeds.",
    },
    {
        "model": "HRX380AQ",
        "opening": "307 x 100 mm",
        "speed": "Up to 80 m/min",
        "washdown": "Hygienic washdown",
        "cabinet": "IP69K",
        "applications": "Cheese, packaged goods, component verification",
        "notes": "Compact washdown platform for hygienic applications and detailed product inspection.",
    },
]


def build_pdf(output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="BodySmall",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#485562"),
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableCell",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#101820"),
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableCellBold",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#101820"),
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Label",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#005f73"),
            spaceAfter=0,
        )
    )

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=landscape(letter),
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title="GreyscaleAI HRX Product Overview",
        author="OpenAI Codex",
    )

    story = []
    story.append(Paragraph("GreyscaleAI HRX Product Overview", styles["Title"]))
    story.append(
        Paragraph(
            "A quick comparison of the standard HRX X-ray inspection systems. "
            "Inspection opening reflects the published X-ray aperture from each brochure. "
            "IP69K models are the hygienic washdown configurations; IP66 models are the standard cabinets.",
            styles["BodySmall"],
        )
    )
    story.append(Spacer(1, 0.22 * inch))

    header = [
        Paragraph("<b>Model</b>", styles["TableCellBold"]),
        Paragraph("<b>Inspection opening</b>", styles["TableCellBold"]),
        Paragraph("<b>Max line speed</b>", styles["TableCellBold"]),
        Paragraph("<b>Washdown</b>", styles["TableCellBold"]),
        Paragraph("<b>Cabinet</b>", styles["TableCellBold"]),
        Paragraph("<b>Typical applications</b>", styles["TableCellBold"]),
    ]

    rows = [header]
    for item in MODELS:
        rows.append(
            [
                Paragraph(item["model"], styles["TableCellBold"]),
                Paragraph(item["opening"], styles["TableCell"]),
                Paragraph(item["speed"], styles["TableCell"]),
                Paragraph(item["washdown"], styles["TableCell"]),
                Paragraph(item["cabinet"], styles["TableCell"]),
                Paragraph(item["applications"], styles["TableCell"]),
            ]
        )

    summary_table = Table(
        rows,
        colWidths=[1.0 * inch, 1.45 * inch, 1.2 * inch, 1.45 * inch, 0.9 * inch, 3.0 * inch],
        repeatRows=1,
    )
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e9f4f7")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0b2545")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fbfc")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cfd8de")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
            ]
        )
    )
    story.append(summary_table)
    story.append(Spacer(1, 0.24 * inch))
    story.append(
        Paragraph(
            "Use the product brochures for dimensional drawings, installation footprints, and detailed machine construction. "
            "Use this overview to narrow the right range by aperture, line speed, and sanitation profile first.",
            styles["BodySmall"],
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("Model Notes", styles["Heading2"]))
    story.append(
        Paragraph(
            "These notes synthesize the brochure positioning into a quick buying guide. "
            "Final fit still depends on product size, package geometry, contamination risk, sanitation standards, and line layout.",
            styles["BodySmall"],
        )
    )
    story.append(Spacer(1, 0.16 * inch))

    note_rows = []
    for item in MODELS:
        note_rows.append(
            [
                Paragraph(item["model"], styles["Label"]),
                Paragraph(item["notes"], styles["BodySmall"]),
            ]
        )

    notes_table = Table(note_rows, colWidths=[1.35 * inch, 8.1 * inch], hAlign="LEFT")
    notes_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe3e8")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f2f8fa")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(notes_table)

    doc.build(story)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    build_pdf(root / "assets/pdf/spec-sheets/GreyscaleAI-HRX-Product-Overview.pdf")
