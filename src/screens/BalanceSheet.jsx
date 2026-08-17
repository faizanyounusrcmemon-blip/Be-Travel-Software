import React, { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const EPS = 1;
const cleanBalance = (v) => {
  const n = Number(v || 0);
  return Math.abs(n) <= EPS ? 0 : n;
};

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`);
      const d = await res.json();
      if (d.success) setData(d);
      else alert(d.error || "Failed to load balance sheet");
    } catch (e) {
      console.error(e);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-5 text-center text-danger fw-bold">⏳ Loading Balance Sheet...</div>;
  if (!data) return null;

  // Filters & Cleaning
  const standardRows = (data.customers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);
  const registeredRows = (data.registeredCustomers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);
  const supplierRows = (data.suppliers || []).map(r => ({ ...r, balance: cleanBalance(r.balance) })).filter(r => r.balance !== 0);
  const bankRows = data.banks || [];

  // Totals Calculations
  const stdTotalSale = standardRows.reduce((a, r) => a + Number(r.sale_total || 0), 0);
  const stdTotalReceived = standardRows.reduce((a, r) => a + Number(r.received || 0), 0);
  const stdTotalBalance = standardRows.reduce((a, r) => a + Number(r.balance || 0), 0);

  const regTotalDebits = registeredRows.reduce((a, r) => a + Number(r.sale_total || 0), 0);
  const regTotalCredits = registeredRows.reduce((a, r) => a + Number(r.received || 0), 0);
  const regTotalBalance = registeredRows.reduce((a, r) => a + Number(r.balance || 0), 0);

  const supTotalPurchase = supplierRows.reduce((a, r) => a + Number(r.purchase_total || 0), 0);
  const supTotalPaid = supplierRows.reduce((a, r) => a + Number(r.paid || 0), 0);
  const supTotalBalance = supplierRows.reduce((a, r) => a + Number(r.balance || 0), 0);

  const bankTotalBalance = bankRows.reduce((a, b) => a + Number(b.balance || 0), 0);

  const getStatusBadge = (status) => {
    if (!status) return null;
    switch (status.toUpperCase()) {
      case "PENDING": return <span className="badge bg-danger">PENDING</span>;
      case "PARTIAL": return <span className="badge bg-warning text-dark">PARTIAL</span>;
      case "PAID": return <span className="badge bg-success">PAID</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const finalPos = Number(data.summary?.final_net_position || 0);

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="mb-4 p-4 rounded-3 shadow-sm text-white" style={{ background: "linear-gradient(90deg, #1e3a8a, #3b82f6)" }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", fontSize: 22 }}>📊</div>
            <div>
              <h4 className="mb-1 fw-bold">Balance Sheet Statement</h4>
              <small className="opacity-75">Customer Receivables, Supplier Payables, Cash in Hand & Bank Balances</small>
            </div>
          </div>
          <button className="btn btn-light btn-sm fw-semibold" onClick={() => onNavigate("dashboard")}>← Back</button>
        </div>
      </div>
      
      {/* SECTION 1: STANDARD CUSTOMERS */}
      <div className="card shadow-sm mb-4 border-start border-success border-3">
        <div className="card-header bg-white fw-bold text-success">📋 Standard Customer Receivable (Walk-In)</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Booking Ref</th>
                <th>Customer Name</th>
                <th className="text-end">Total Sale</th>
                <th className="text-end">Received</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {standardRows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-2">No walk-in balance.</td></tr>}
              {standardRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-secondary">{r.ref_no}</td>
                  <td className="fw-semibold">{r.customer_name}</td>
                  <td className="text-end">{fmt(r.sale_total)}</td>
                  <td className="text-end">{fmt(r.received)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-success"}`}>{fmt(r.balance)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
            {standardRows.length > 0 && (
              <tfoot className="table-secondary fw-bold">
                <tr>
                  <td colSpan="3" className="text-end">Total Walk-In Customer:</td>
                  <td className="text-end">{fmt(stdTotalSale)}</td>
                  <td className="text-end">{fmt(stdTotalReceived)}</td>
                  <td className={`text-end ${stdTotalBalance < 0 ? "text-primary" : "text-success"}`}>{fmt(stdTotalBalance)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* SECTION 2: REGISTERED CUSTOMERS */}
      <div className="card shadow-sm mb-4 border-start border-info border-3">
        <div className="card-header bg-white fw-bold text-info">🔑 Registered Ledger Customers Accounts</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Customer Code</th>
                <th>Account Name</th>
                <th className="text-end">Total Debits</th>
                <th className="text-end">Total Credits</th>
                <th className="text-end">Current Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registeredRows.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-2">No registered customer accounts balance.</td></tr>}
              {registeredRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-dark">{r.customer_code}</td>
                  <td className="fw-semibold text-primary">{r.customer_name}</td>
                  <td className="text-end">{fmt(r.sale_total)}</td>
                  <td className="text-end">{fmt(r.received)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-danger"}`}>{fmt(r.balance)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
            {registeredRows.length > 0 && (
              <tfoot className="table-secondary fw-bold">
                <tr>
                  <td colSpan="3" className="text-end">Total Registered Customers:</td>
                  <td className="text-end">{fmt(regTotalDebits)}</td>
                  <td className="text-end">{fmt(regTotalCredits)}</td>
                  <td className={`text-end ${regTotalBalance < 0 ? "text-primary" : "text-danger"}`}>{fmt(regTotalBalance)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* SECTION 3: SUPPLIERS */}
      <div className="card shadow-sm mb-4 border-start border-danger border-3">
        <div className="card-header bg-white fw-bold text-danger">📦 Supplier Payable</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Supplier Code</th>
                <th>Supplier Name</th>
                <th className="text-end">Total Purchase</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {supplierRows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-secondary">{r.supplier_code}</td>
                  <td className="fw-semibold">{r.supplier_name}</td>
                  <td className="text-end">{fmt(r.purchase_total)}</td>
                  <td className="text-end">{fmt(r.paid)}</td>
                  <td className={`text-end fw-bold ${r.balance < 0 ? "text-primary" : "text-danger"}`}>{fmt(r.balance)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
            {supplierRows.length > 0 && (
              <tfoot className="table-secondary fw-bold">
                <tr>
                  <td colSpan="3" className="text-end">Total Supplier:</td>
                  <td className="text-end">{fmt(supTotalPurchase)}</td>
                  <td className="text-end">{fmt(supTotalPaid)}</td>
                  <td className={`text-end ${supTotalBalance < 0 ? "text-primary" : "text-danger"}`}>{fmt(supTotalBalance)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* SECTION 4: BANK PROFILES */}
      <div className="card shadow-sm mb-4 border-start border-primary border-3">
        <div className="card-header bg-white fw-bold text-primary">🏦 Bank Accounts Balances</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Bank Name</th>
                <th>Account Title</th>
                <th>Account Number</th>
                <th className="text-end">Available Balance</th>
              </tr>
            </thead>
            <tbody>
              {bankRows.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-2">No active bank accounts found.</td></tr>}
              {bankRows.map((b, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="fw-bold text-dark">{b.bank_name}</td>
                  <td>{b.account_title}</td>
                  <td className="text-muted">{b.account_number}</td>
                  <td className={`text-end fw-bold ${b.balance >= 0 ? "text-success" : "text-danger"}`}>{fmt(b.balance)}</td>
                </tr>
              ))}
            </tbody>
            {bankRows.length > 0 && (
              <tfoot className="table-secondary fw-bold">
                <tr>
                  <td colSpan="4" className="text-end">Total Available Bank Balance:</td>
                  <td className={`text-end ${bankTotalBalance >= 0 ? "text-success" : "text-danger"}`}>{fmt(bankTotalBalance)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* SUMMARY & FINAL POSITION BLOCK */}
      <div className="card shadow-sm">
        <div className="card-header bg-white fw-bold text-dark">📌 Complete System Summary</div>
        <table className="table mb-0">
          <tbody>
            <tr>
              <td>💰 Total Customer Receivables (+ Assets)</td>
              <td className="text-end fw-bold text-success">+{fmt(data.summary?.total_receivable)}</td>
            </tr>
            <tr>
              <td>💵 Cash in Hand (+ Assets)</td>
              <td className="text-end fw-bold text-success">+{fmt(data.summary?.cash_in_hand)}</td>
            </tr>
            <tr>
              <td>🏦 Total Bank Accounts Balance (+ Assets)</td>
              <td className="text-end fw-bold text-success">+{fmt(data.summary?.total_bank_balance)}</td>
            </tr>
            <tr>
              <td>💸 Total Extra Paid Adjustments (+ Assets)</td>
              <td className="text-end fw-bold text-success">+{fmt(data.summary?.total_extra_paid)}</td>
            </tr>
            <tr className="table-light">
              <td>📦 Total Supplier Payables (- Liabilities)</td>
              <td className="text-end fw-bold text-danger">-{fmt(data.summary?.total_payable)}</td>
            </tr>
            <tr className="table-light">
              <td>💎 Total Extra Received Adjustments (- Liabilities)</td>
              <td className="text-end fw-bold text-danger">-{fmt(data.summary?.total_extra_received)}</td>
            </tr>
            <tr className="fw-bold" style={{ fontSize: "1.1rem" }}>
              <td 
                className="py-3 text-white" 
                style={{ backgroundColor: finalPos >= 0 ? "#0d6efd" : "#dc3545" }}
              >
                🏁 Final Net Financial Position <br />
                <small className="fw-normal opacity-75">
                  {finalPos >= 0 
                    ? "(Lene zyada hain / Saare Payables dene ke baad bachat)" 
                    : "(Dene zyada hain / Shortage)"}
                </small>
              </td>
              <td 
                className="text-end align-middle py-3 text-white" 
                style={{ backgroundColor: finalPos >= 0 ? "#0d6efd" : "#dc3545" }}
              >
                {finalPos >= 0 
                  ? `PKR ${fmt(finalPos)} (LENE HAIN - NET SURPLUS)` 
                  : `PKR ${fmt(Math.abs(finalPos))} (DENE HAIN - NET DEFICIT)`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}