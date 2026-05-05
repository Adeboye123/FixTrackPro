import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Plus, Search, MoreHorizontal, X, Printer, User, Smartphone, Laptop, Hash, CreditCard, Mail, MessageSquare, Tag, Lock, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { useToast } from "../context/ToastContext";
import { hasFeature, getMinPlanForFeature } from "../config/planConfig";
import { RepairsSkeleton } from "../components/Skeleton";

// Helper: determines if a repair should show "Print Label" (check-in) vs "Print Receipt" (completed)
const isLabelStatus = (status: string) => ['Received', 'Diagnosing', 'Waiting for Parts', 'Repairing'].includes(status);

export default function Repairs() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userPlan = user.plan || 'Trial';

  const canPrintReceipt = hasFeature(userPlan, 'receiptPrinting');
  const canPrintLabel = hasFeature(userPlan, 'deviceLabels');
  const canEmail = hasFeature(userPlan, 'emailNotifications');
  const canSMS = hasFeature(userPlan, 'smsNotifications');

  const [repairs, setRepairs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Print preview state
  const [printRepair, setPrintRepair] = useState<any>(null);
  const [printType, setPrintType] = useState<'receipt' | 'label'>('receipt');
  const printRef = useRef<HTMLDivElement>(null);

  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    deviceType: "Phone",
    deviceModel: "",
    imeiSerial: "",
    faultDescription: "",
    accessories: "",
    estimatedCost: "",
    amountPaid: "0",
    technicianId: "",
  });

  useEffect(() => {
    document.title = "Repairs — FixTrack Pro";
    Promise.all([fetchRepairs(), fetchStaff()]);
  }, []);

  const fetchRepairs = async () => {
    const data = await api.repairs.list();
    setRepairs(data);
    setLoading(false);
  };

  const fetchStaff = async () => {
    const data = await api.staff.list();
    setStaff(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.repairs.create({
      ...formData,
      estimatedCost: parseFloat(formData.estimatedCost),
      amountPaid: parseFloat(formData.amountPaid),
      technicianId: formData.technicianId || null,
    });

    if (res.id) {
      // Fetch full repair to show print preview
      const allRepairs = await api.repairs.list();
      const newRepair = allRepairs.find((r: any) => r.id === res.id);
      if (newRepair) {
        // Auto-open label print preview for new check-in
        setPrintRepair(newRepair);
        setPrintType('label');
      }
    }

    setShowModal(false);
    resetForm();
    fetchRepairs();
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.repairs.update(editData.id, {
        amountPaid: parseFloat(editData.amountPaid),
        status: editData.status,
        technicianId: editData.technicianId || null
      });
      setShowEditModal(false);
      setEditData(null);
      fetchRepairs();
    } catch (err: any) {
      error(err.message || "Failed to update repair");
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      deviceType: "Phone",
      deviceModel: "",
      imeiSerial: "",
      faultDescription: "",
      accessories: "",
      estimatedCost: "",
      amountPaid: "0",
      technicianId: "",
    });
  };

  const updateStatus = async (id: string, status: string) => {
    await api.repairs.update(id, { status });
    fetchRepairs();
  };

  // ────── Print Functions ──────
  const openPrintPreview = (repair: any, type: 'receipt' | 'label') => {
    setPrintRepair(repair);
    setPrintType(type);
  };

  // Helper: resolve logo URL to absolute URL for print windows
  const getAbsoluteLogoUrl = () => {
    if (!user.logoUrl) return '';
    if (user.logoUrl.startsWith('http') || user.logoUrl.startsWith('data:')) return user.logoUrl;
    return `${window.location.origin}${user.logoUrl}`;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      error("Pop-up blocked. Please allow pop-ups for printing.");
      return;
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        @page { margin: 5mm; }
        .receipt-container { width: 72mm; margin: 0 auto; padding: 3mm; }
        .label-container { width: 148mm; margin: 0 auto; padding: 6mm; }
        .shop-header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 8px; }
        .shop-logo { max-width: 50px; max-height: 50px; margin: 0 auto 4px; display: block; object-fit: contain; }
        .shop-name { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; }
        .shop-subtitle { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .shop-contact { font-size: 8px; color: #64748b; margin-top: 2px; }
        .section { margin-bottom: 8px; }
        .section-title { font-size: 7px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .row { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; }
        .row .label { color: #64748b; }
        .row .value { font-weight: 600; text-align: right; max-width: 55%; }
        .divider { border-top: 1px solid #e2e8f0; margin: 6px 0; }
        .dashed-divider { border-top: 2px dashed #e2e8f0; margin: 8px 0; }
        .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; padding: 4px 0; }
        .paid { color: #059669; }
        .balance { color: #dc2626; }
        .footer { text-align: center; font-size: 7px; color: #94a3b8; margin-top: 10px; padding-top: 8px; border-top: 2px dashed #e2e8f0; }
        .footer p { margin: 2px 0; }
        .job-id-box { border: 2px solid #1e293b; padding: 6px; text-align: center; margin: 8px 0; }
        .job-id-box .label { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .job-id-box .value { font-size: 22px; font-weight: 900; font-family: 'Courier New', monospace; }
        /* Label specific */
        .label-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .label-section { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
        .label-section h3 { font-size: 9px; font-weight: 800; color: #6366f1; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
        .label-row { font-size: 10px; padding: 2px 0; }
        .label-row .label { color: #64748b; font-size: 8px; }
        .label-row .value { font-weight: 600; }
        .sig-line { border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 4px; font-size: 8px; color: #64748b; text-align: center; }
        .label-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 4px; }
        .label-header-left { display: flex; align-items: center; gap: 8px; }
        .label-logo { max-width: 40px; max-height: 40px; object-fit: contain; }
        .label-shop-name { font-size: 18px; font-weight: 900; text-transform: uppercase; }
        .label-shop-sub { font-size: 8px; color: #64748b; font-weight: 700; }
        .label-job-id { font-size: 22px; font-weight: 900; font-family: 'Courier New', monospace; text-align: right; }
        .label-job-label { font-size: 8px; color: #64748b; font-weight: 700; text-align: right; }
        .terms { font-size: 7px; color: #94a3b8; margin-top: 12px; padding: 6px; background: #f8fafc; border-radius: 4px; }
        .terms p { margin: 1px 0; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>${printType === 'receipt' ? 'Receipt' : 'Jobcard'} - ${printRepair?.job_id}</title>${styles}</head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();

    // Wait for all images to load before printing
    const images = printWindow.document.querySelectorAll('img');
    if (images.length === 0) {
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 200);
    } else {
      let loaded = 0;
      const totalImages = images.length;
      const onAllLoaded = () => {
        loaded++;
        if (loaded >= totalImages) {
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 100);
        }
      };
      images.forEach(img => {
        if (img.complete) {
          onAllLoaded();
        } else {
          img.addEventListener('load', onAllLoaded);
          img.addEventListener('error', onAllLoaded);
        }
      });
      // Fallback: print after 3 seconds even if images fail
      setTimeout(() => {
        if (loaded < totalImages) {
          printWindow.print();
          printWindow.close();
        }
      }, 3000);
    }
  };

  // Helper: load logo as data URL for PDF embedding
  const loadLogoAsDataUrl = (): Promise<string | null> => {
    const logoUrl = getAbsoluteLogoUrl();
    if (!logoUrl) return Promise.resolve(null);
    if (logoUrl.startsWith('data:')) return Promise.resolve(logoUrl);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = logoUrl;
    });
  };

  const handleDownloadPDF = async () => {
    if (!printRepair) return;
    const r = printRepair;
    const isReceipt = printType === 'receipt';

    // Load logo as data URL for embedding
    const logoDataUrl = await loadLogoAsDataUrl();

    const pdf = new jsPDF({
      orientation: isReceipt ? "portrait" : "landscape",
      unit: "mm",
      format: isReceipt ? [80, 200] : "a5",
    });

    const w = pdf.internal.pageSize.getWidth();
    let y = 8;
    const leftMargin = 4;

    // Add logo to PDF if available
    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, 'PNG', w / 2 - 8, y, 16, 16);
        y += 18;
      } catch {
        // Skip logo if addImage fails
      }
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(user.name || "FixTrack Pro", w / 2, y, { align: "center" });
    y += 5;
    pdf.setFontSize(7);
    pdf.setTextColor(100);
    pdf.text(isReceipt ? "REPAIR RECEIPT" : "DEVICE JOBCARD", w / 2, y, { align: "center" });
    y += 3;
    if (user.address) {
      pdf.setFontSize(6);
      pdf.text(user.address, w / 2, y, { align: "center" });
      y += 3;
    }
    if (user.phone) {
      pdf.text(user.phone, w / 2, y, { align: "center" });
      y += 3;
    }

    pdf.setDrawColor(200);
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(leftMargin, y, w - leftMargin, y);
    y += 5;

    // Job ID
    pdf.setTextColor(0);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("Job ID:", leftMargin, y);
    pdf.setFont("courier", "bold");
    pdf.setFontSize(12);
    pdf.text(r.job_id, w - leftMargin, y, { align: "right" });
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    // Receipt shows print date; Jobcard shows registration date
    const displayDate = isReceipt ? new Date() : new Date(r.created_at);
    pdf.text(isReceipt ? "Print Date:" : "Date Registered:", leftMargin, y);
    pdf.setTextColor(0);
    pdf.text(format(displayDate, "dd/MM/yyyy HH:mm"), w - leftMargin, y, { align: "right" });
    y += 5;

    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(leftMargin, y, w - leftMargin, y);
    y += 4;

    // Customer details
    const addRow = (label: string, value: string) => {
      pdf.setTextColor(100);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(label, leftMargin, y);
      pdf.setTextColor(0);
      pdf.setFont("helvetica", "bold");
      const maxWidth = w - leftMargin * 2 - 25;
      const lines = pdf.splitTextToSize(value, maxWidth);
      pdf.text(lines, w - leftMargin, y, { align: "right" });
      y += lines.length * 4 + 1;
    };

    addRow("Customer:", r.customer_name);
    addRow("Phone:", r.customer_phone);
    y += 2;

    addRow("Device:", `${r.device_type} - ${r.device_model}`);
    addRow("Fault:", r.fault_description);
    if (r.imei_serial) addRow("IMEI/SN:", r.imei_serial);
    if (r.accessories) addRow("Accessories:", r.accessories);
    addRow("Technician:", r.technician_name || "Unassigned");
    addRow("Status:", r.status);
    y += 2;

    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(leftMargin, y, w - leftMargin, y);
    y += 4;

    // Payment
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0);
    pdf.text("Estimated Cost:", leftMargin, y);
    pdf.text(`₦${r.estimated_cost.toLocaleString()}`, w - leftMargin, y, { align: "right" });
    y += 5;

    pdf.setTextColor(5, 150, 105);
    pdf.text("Amount Paid:", leftMargin, y);
    pdf.text(`₦${r.amount_paid.toLocaleString()}`, w - leftMargin, y, { align: "right" });
    y += 5;

    const balance = r.estimated_cost - r.amount_paid;
    pdf.setTextColor(220, 38, 38);
    pdf.setFontSize(10);
    pdf.text("Balance Due:", leftMargin, y);
    pdf.text(`₦${balance.toLocaleString()}`, w - leftMargin, y, { align: "right" });
    y += 6;

    // Footer
    pdf.setLineDashPattern([1, 1], 0);
    pdf.setDrawColor(200);
    pdf.line(leftMargin, y, w - leftMargin, y);
    y += 4;

    pdf.setTextColor(150);
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.text("Thank you for your business!", w / 2, y, { align: "center" });
    y += 3;
    pdf.text("Please present this receipt for device collection.", w / 2, y, { align: "center" });
    y += 3;
    pdf.text("Powered by FixTrack Pro", w / 2, y, { align: "center" });

    pdf.save(`${isReceipt ? 'Receipt' : 'Jobcard'}-${r.job_id}.pdf`);
    success(`${isReceipt ? 'Receipt' : 'Jobcard'} PDF downloaded!`);
  };

  const handleNotify = async (id: string, type: 'sms' | 'email') => {
    if (type === 'email' && !canEmail) {
      error(`Email notifications require ${getMinPlanForFeature('emailNotifications')} plan or higher.`);
      setTimeout(() => navigate('/billing'), 1500);
      return;
    }
    if (type === 'sms' && !canSMS) {
      error(`SMS notifications require ${getMinPlanForFeature('smsNotifications')} plan or higher.`);
      setTimeout(() => navigate('/billing'), 1500);
      return;
    }
    try {
      const result = await api.repairs.notify(id, type);
      
      if (result.method === 'whatsapp') {
        // SMS not configured — open WhatsApp with pre-filled message
        window.open(result.whatsappLink, '_blank');
        success('Opening WhatsApp with customer message...');
      } else {
        success(`${type.toUpperCase()} notification sent!`);
      }
    } catch (err: any) {
      error(err.message || "Failed to send notification.");
    }
  };

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = 
      repair.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      repair.job_id.toLowerCase().includes(search.toLowerCase()) ||
      repair.device_model.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === "All" || repair.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // ────── Receipt Template (thermal 80mm) ──────
  const ReceiptTemplate = ({ repair }: { repair: any }) => {
    const absoluteLogo = getAbsoluteLogoUrl();
    return (
    <div className="receipt-container">
      <div className="shop-header">
        {absoluteLogo && <img src={absoluteLogo} alt="Logo" className="shop-logo" />}
        <div className="shop-name">{user.name || "FixTrack Pro"}</div>
        <div className="shop-subtitle">Repair Receipt</div>
        {user.address && <div className="shop-contact">{user.address}</div>}
        {user.phone && <div className="shop-contact">{user.phone}</div>}
      </div>

      <div className="section">
        <div className="row"><span className="label">Job ID:</span><span className="value" style={{ fontFamily: "'Courier New', monospace", fontWeight: 900, color: '#6366f1' }}>{repair.job_id}</span></div>
        <div className="row"><span className="label">Print Date:</span><span className="value">{format(new Date(), "dd/MM/yyyy HH:mm")}</span></div>
        <div className="row"><span className="label">Registered:</span><span className="value" style={{ fontSize: '9px', color: '#94a3b8' }}>{format(new Date(repair.created_at), "dd/MM/yyyy HH:mm")}</span></div>
        <div className="row"><span className="label">Status:</span><span className="value">{repair.status}</span></div>
      </div>

      <div className="divider"></div>

      <div className="section">
        <div className="section-title">Customer</div>
        <div className="row"><span className="label">Name:</span><span className="value">{repair.customer_name}</span></div>
        <div className="row"><span className="label">Phone:</span><span className="value">{repair.customer_phone}</span></div>
      </div>

      <div className="divider"></div>

      <div className="section">
        <div className="section-title">Device</div>
        <div className="row"><span className="label">Type:</span><span className="value">{repair.device_type}</span></div>
        <div className="row"><span className="label">Model:</span><span className="value">{repair.device_model}</span></div>
        <div className="row"><span className="label">Fault:</span><span className="value" style={{ maxWidth: '55%' }}>{repair.fault_description}</span></div>
        {repair.imei_serial && <div className="row"><span className="label">IMEI/SN:</span><span className="value">{repair.imei_serial}</span></div>}
        {repair.accessories && <div className="row"><span className="label">Accessories:</span><span className="value">{repair.accessories}</span></div>}
      </div>

      <div className="dashed-divider"></div>

      <div className="section">
        <div className="section-title">Payment Summary</div>
        <div className="row"><span className="label">Estimated Cost:</span><span className="value">₦{repair.estimated_cost.toLocaleString()}</span></div>
        <div className="row"><span className="label">Amount Paid:</span><span className="value paid">₦{repair.amount_paid.toLocaleString()}</span></div>
        <div className="divider"></div>
        <div className="total-row"><span className="balance">Balance Due:</span><span className="balance">₦{(repair.estimated_cost - repair.amount_paid).toLocaleString()}</span></div>
      </div>

      <div className="footer">
        <p>Thank you for choosing {user.name || "us"}!</p>
        <p>Please present this receipt for device collection.</p>
        <p style={{ marginTop: '4px', fontWeight: 700 }}>Powered by FixTrack Pro</p>
      </div>
    </div>
    );
  };

  // ────── Label/Jobcard Template (A5‐ish) ──────
  const LabelTemplate = ({ repair }: { repair: any }) => {
    const absoluteLogo = getAbsoluteLogoUrl();
    return (
    <div className="label-container">
      <div className="label-header">
        <div className="label-header-left">
          {absoluteLogo && <img src={absoluteLogo} alt="Logo" className="label-logo" />}
          <div>
            <div className="label-shop-name">{user.name || "FixTrack Pro"}</div>
            <div className="label-shop-sub">Device Check-In Jobcard</div>
          </div>
        </div>
        <div>
          <div className="label-job-label">JOB ID</div>
          <div className="label-job-id">{repair.job_id}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#64748b', marginTop: '4px' }}>
        <span>Date Registered: {format(new Date(repair.created_at), "dd/MM/yyyy HH:mm")}</span>
        {user.address && <span>{user.address}</span>}
        {user.phone && <span>Tel: {user.phone}</span>}
      </div>

      <div className="label-grid">
        <div className="label-section">
          <h3>Customer Information</h3>
          <div className="label-row"><div className="label">Name</div><div className="value">{repair.customer_name}</div></div>
          <div className="label-row"><div className="label">Phone</div><div className="value">{repair.customer_phone}</div></div>
        </div>
        <div className="label-section">
          <h3>Device Information</h3>
          <div className="label-row"><div className="label">Type</div><div className="value">{repair.device_type}</div></div>
          <div className="label-row"><div className="label">Model</div><div className="value">{repair.device_model}</div></div>
          {repair.imei_serial && <div className="label-row"><div className="label">IMEI / Serial No.</div><div className="value">{repair.imei_serial}</div></div>}
        </div>
        <div className="label-section" style={{ gridColumn: 'span 2' }}>
          <h3>Fault Description</h3>
          <div style={{ fontSize: '10px' }}>{repair.fault_description}</div>
        </div>
        <div className="label-section">
          <h3>Accessories Collected</h3>
          <div style={{ fontSize: '10px' }}>{repair.accessories || "None"}</div>
        </div>
        <div className="label-section">
          <h3>Repair Details</h3>
          <div className="label-row"><div className="label">Technician</div><div className="value">{repair.technician_name || "Unassigned"}</div></div>
          <div className="label-row"><div className="label">Estimated Cost</div><div className="value" style={{ fontWeight: 900 }}>₦{repair.estimated_cost.toLocaleString()}</div></div>
          <div className="label-row"><div className="label">Deposit Paid</div><div className="value" style={{ color: '#059669' }}>₦{repair.amount_paid.toLocaleString()}</div></div>
        </div>
      </div>

      <div className="terms">
        <p><strong>Terms:</strong> Devices uncollected after 90 days may be disposed of. We are not liable for data loss during repair.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <div style={{ flex: 1 }}>
          <div className="sig-line">Customer Signature</div>
        </div>
        <div style={{ width: '30px' }}></div>
        <div style={{ flex: 1 }}>
          <div className="sig-line">Staff Signature</div>
        </div>
      </div>
    </div>
    );
  };

  if (loading) return <RepairsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repair Management</h1>
          <p className="text-slate-500">Track and manage all device repairs in your shop.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Repair Ticket
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Job ID, customer or device..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-50 outline-none"
          >
            <option value="All">All Status</option>
            <option value="Received">Received</option>
            <option value="Diagnosing">Diagnosing</option>
            <option value="Waiting for Parts">Waiting for Parts</option>
            <option value="Repairing">Repairing</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Job ID & Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Device & Tech</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRepairs.map((repair) => {
                const showLabel = isLabelStatus(repair.status);
                return (
                <tr key={repair.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-indigo-600">{repair.job_id}</p>
                    <p className="font-bold text-slate-900">{repair.customer_name}</p>
                    <p className="text-xs text-slate-500 md:hidden">{repair.device_model}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {repair.device_type === 'Phone' ? <Smartphone className="w-3 h-3 text-slate-400" /> : <Laptop className="w-3 h-3 text-slate-400" />}
                      <p className="font-medium text-slate-700">{repair.device_model}</p>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> {repair.technician_name || 'Unassigned'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={repair.status}
                      onChange={(e) => updateStatus(repair.id, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase outline-none border-none cursor-pointer ${
                        repair.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' :
                        repair.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                        repair.status === 'Repairing' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <option value="Received">Received</option>
                      <option value="Diagnosing">Diagnosing</option>
                      <option value="Waiting for Parts">Waiting for Parts</option>
                      <option value="Repairing">Repairing</option>
                      <option value="Completed">Completed</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-slate-900">₦{repair.estimated_cost.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold uppercase ${
                      repair.payment_status === 'Paid' ? 'text-emerald-600' : 
                      repair.payment_status === 'Part Payment' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {repair.payment_status} (₦{repair.amount_paid.toLocaleString()})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Smart Print Button — Label or Receipt based on status */}
                      {showLabel ? (
                        <button 
                          onClick={() => {
                            if (!canPrintLabel) {
                              error(`Device labels require ${getMinPlanForFeature('deviceLabels')} plan or higher.`);
                              setTimeout(() => navigate('/billing'), 1500);
                              return;
                            }
                            openPrintPreview(repair, 'label');
                          }}
                          className={`p-2 rounded-lg transition-colors ${canPrintLabel ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-300 cursor-pointer'}`}
                          title={canPrintLabel ? 'Print Jobcard' : `Requires ${getMinPlanForFeature('deviceLabels')}+ plan`}
                        >
                          {canPrintLabel ? <Tag className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (!canPrintReceipt) {
                              error(`Receipt printing requires ${getMinPlanForFeature('receiptPrinting')} plan or higher.`);
                              setTimeout(() => navigate('/billing'), 1500);
                              return;
                            }
                            openPrintPreview(repair, 'receipt');
                          }}
                          className={`p-2 rounded-lg transition-colors ${canPrintReceipt ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-slate-300 cursor-pointer'}`}
                          title={canPrintReceipt ? 'Print Receipt' : `Requires ${getMinPlanForFeature('receiptPrinting')}+ plan`}
                        >
                          {canPrintReceipt ? <Printer className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      )}
                      <button 
                        onClick={() => handleNotify(repair.id, 'email')}
                        className={`p-2 rounded-lg transition-colors ${canEmail ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-300 cursor-pointer'}`}
                        title={canEmail ? 'Send Email' : `Requires ${getMinPlanForFeature('emailNotifications')}+ plan`}
                      >
                        {canEmail ? <Mail className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleNotify(repair.id, 'sms')}
                        className={`p-2 rounded-lg transition-colors ${canSMS ? 'text-slate-400 hover:text-green-600 hover:bg-green-50' : 'text-slate-300 cursor-pointer'}`}
                        title={canSMS ? 'Notify via WhatsApp' : `Requires ${getMinPlanForFeature('smsNotifications')}+ plan`}
                      >
                        {canSMS ? <MessageSquare className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditData({
                            id: repair.id,
                            amountPaid: repair.amount_paid,
                            status: repair.status,
                            technicianId: repair.technician_id?.id || repair.technician_id || "",
                            customerName: repair.customer_name,
                            jobId: repair.job_id
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Payment & Status"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════ PRINT PREVIEW MODAL ═══════════ */}
      {printRepair && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  Print Preview — {printType === 'receipt' ? 'Receipt' : 'Jobcard'}
                </h2>
                <p className="text-xs text-slate-500">{printRepair.customer_name} · {printRepair.job_id}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle between receipt/label */}
                <div className="flex bg-slate-200 rounded-lg p-0.5 text-xs font-bold">
                  <button
                    onClick={() => setPrintType('label')}
                    className={`px-3 py-1.5 rounded-md transition-all ${printType === 'label' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Jobcard
                  </button>
                  <button
                    onClick={() => setPrintType('receipt')}
                    className={`px-3 py-1.5 rounded-md transition-all ${printType === 'receipt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Receipt
                  </button>
                </div>
                <button onClick={() => setPrintRepair(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              <div className="bg-white shadow-lg rounded-lg mx-auto" style={{ maxWidth: printType === 'receipt' ? '320px' : '600px' }}>
                <div ref={printRef}>
                  {printType === 'receipt'
                    ? <ReceiptTemplate repair={printRepair} />
                    : <LabelTemplate repair={printRepair} />
                  }
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white flex-shrink-0">
              <button
                onClick={() => setPrintRepair(null)}
                className="px-4 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-all text-sm"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all text-sm"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EDIT PAYMENT MODAL ═══════════ */}
      {showEditModal && editData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Update Repair</h2>
                <p className="text-xs text-slate-500">{editData.customerName} - {editData.jobId}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount Paid (₦)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-lg"
                  value={editData.amountPaid}
                  onChange={(e) => setEditData({ ...editData, amountPaid: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Repair Status</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <option value="Received">Received</option>
                  <option value="Diagnosing">Diagnosing</option>
                  <option value="Waiting for Parts">Waiting for Parts</option>
                  <option value="Repairing">Repairing</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Technician</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editData.technicianId}
                  onChange={(e) => setEditData({ ...editData, technicianId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ NEW REPAIR MODAL ═══════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">New Repair Ticket</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Customer Info</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="080..."
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest pt-2">Device Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.deviceType}
                      onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    >
                      <option value="Phone">Phone</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="iPhone 13"
                      value={formData.deviceModel}
                      onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> IMEI / Serial Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Optional"
                    value={formData.imeiSerial}
                    onChange={(e) => setFormData({ ...formData, imeiSerial: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Repair & Billing</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fault Description</label>
                  <textarea
                    required
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Broken screen, charging port..."
                    value={formData.faultDescription}
                    onChange={(e) => setFormData({ ...formData, faultDescription: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Accessories Collected</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Charger, Case, SIM Card..."
                    value={formData.accessories}
                    onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Estimate (₦)
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      placeholder="0"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deposit (₦)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      placeholder="0"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Technician</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.technicianId}
                    onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  >
                    <option value="">Select Technician</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Generate Ticket
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
