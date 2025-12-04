from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from io import BytesIO
import qrcode
from app.models.salary_slip import SalarySlip
from app.models.user import User


def generate_salary_slip_pdf(salary_slip: SalarySlip, employee: User) -> bytes:
    """Generate a professional salary slip PDF."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#3B82F6'),
        spaceAfter=12
    )
    
    # Title
    elements.append(Paragraph("SALARY SLIP", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Company Info (placeholder)
    company_info = [
        ["<b>Company Name:</b>", "Anshumat Technologies"],
        ["<b>Address:</b>", "123 Business Street, City, Country"],
        ["<b>Period:</b>", f"{salary_slip.month:02d}/{salary_slip.year}"],
    ]
    
    company_table = Table(company_info, colWidths=[2*inch, 4*inch])
    company_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(company_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Employee Information
    elements.append(Paragraph("Employee Information", heading_style))
    employee_info = [
        ["<b>Employee ID:</b>", str(employee.id)],
        ["<b>Name:</b>", employee.full_name],
        ["<b>Email:</b>", employee.email],
        ["<b>Department:</b>", employee.department or "N/A"],
        ["<b>Position:</b>", employee.position or "N/A"],
    ]
    
    if salary_slip.payment_date:
        employee_info.append(["<b>Payment Date:</b>", salary_slip.payment_date.strftime("%d/%m/%Y")])
    
    emp_table = Table(employee_info, colWidths=[2*inch, 4*inch])
    emp_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Salary Breakdown
    elements.append(Paragraph("Salary Breakdown", heading_style))
    salary_data = [
        ["<b>Description</b>", "<b>Amount (USD)</b>"],
        ["Basic Salary", f"${salary_slip.basic_salary:,.2f}"],
        ["Allowances", f"${salary_slip.allowances:,.2f}"],
        ["", ""],
        ["<b>Gross Salary</b>", f"<b>${salary_slip.basic_salary + salary_slip.allowances:,.2f}</b>"],
        ["Deductions", f"-${salary_slip.deductions:,.2f}"],
        ["Tax", f"-${salary_slip.tax:,.2f}"],
        ["", ""],
        ["<b>Net Salary</b>", f"<b>${salary_slip.net_salary:,.2f}</b>"],
    ]
    
    salary_table = Table(salary_data, colWidths=[4*inch, 2*inch])
    salary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 4), (1, 4), 'Helvetica-Bold'),
        ('FONTNAME', (0, 8), (1, 8), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E5E7EB')),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#DBEAFE')),
        ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#D1FAE5')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
    ]))
    elements.append(salary_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Notes
    if salary_slip.notes:
        elements.append(Paragraph("<b>Notes:</b>", styles['Normal']))
        elements.append(Paragraph(salary_slip.notes, styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))
    
    # QR Code for verification
    qr_data = f"Salary Slip ID: {salary_slip.id}\nEmployee: {employee.email}\nPeriod: {salary_slip.month}/{salary_slip.year}\nNet Salary: ${salary_slip.net_salary:,.2f}"
    qr = qrcode.QRCode(version=1, box_size=4, border=2)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    qr_image = Image(qr_buffer, width=1*inch, height=1*inch)
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("Verification QR Code:", styles['Normal']))
    elements.append(qr_image)
    
    # Footer
    elements.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    elements.append(Paragraph("This is a computer-generated document. No signature required.", footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

