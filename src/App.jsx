import React, { useEffect, useMemo, useState } from 'react';

const periodProfiles = {
  Minggu: {
    label: 'Minggu ini',
    target: 'Rp 9,2 Jt',
    progress: 68,
    insight: 'Arus kas minggu ini masih aman dan pengeluaran turun 4% dibanding pekan lalu.',
  },
  Bulan: {
    label: 'Bulan ini',
    target: 'Rp 30 Jt',
    progress: 78,
    insight: 'Target bulanan sudah mencapai 78% — masih ada ruang untuk optimasi.',
  },
  Tahun: {
    label: 'Tahun ini',
    target: 'Rp 240 Jt',
    progress: 64,
    insight: 'Pertumbuhan investasi dan pendapatan tahunan tetap konsisten dengan tren positif.',
  },
};

const metricsByPeriod = {
  Minggu: [
    { label: 'Saldo Total', value: 'Rp 18,5 Jt', trend: '+4.1%', tone: 'good' },
    { label: 'Pendapatan', value: 'Rp 6,9 Jt', trend: '+2.8%', tone: 'good' },
    { label: 'Pengeluaran', value: 'Rp 4,1 Jt', trend: '-4.0%', tone: 'warn' },
    { label: 'Tabungan', value: 'Rp 2,8 Jt', trend: '+5.2%', tone: 'good' },
  ],
  Bulan: [
    { label: 'Saldo Total', value: 'Rp 128,4 Jt', trend: '+12.8%', tone: 'good' },
    { label: 'Pendapatan Bulan Ini', value: 'Rp 42,8 Jt', trend: '+8.4%', tone: 'good' },
    { label: 'Pengeluaran', value: 'Rp 27,2 Jt', trend: '-3.1%', tone: 'warn' },
    { label: 'Tabungan', value: 'Rp 15,6 Jt', trend: '+5.6%', tone: 'good' },
  ],
  Tahun: [
    { label: 'Saldo Total', value: 'Rp 310,2 Jt', trend: '+18.6%', tone: 'good' },
    { label: 'Pendapatan Tahunan', value: 'Rp 142,7 Jt', trend: '+11.3%', tone: 'good' },
    { label: 'Pengeluaran', value: 'Rp 96,4 Jt', trend: '+2.1%', tone: 'warn' },
    { label: 'Tabungan', value: 'Rp 46,1 Jt', trend: '+14.9%', tone: 'good' },
  ],
};

const createTransactionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const normalizeTransactions = (items = []) =>
  items.map((item, index) => ({
    ...item,
    id: item.id ?? `tx-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }));

const initialTransactions = [
  { id: createTransactionId(), name: 'Gaji Tim', type: 'Pemasukan', amount: '+ Rp 18.000.000', time: '09:15' },
  { id: createTransactionId(), name: 'Pembelian Tools', type: 'Pengeluaran', amount: '- Rp 4.250.000', time: '11:40' },
  { id: createTransactionId(), name: 'Investasi', type: 'Tabungan', amount: '+ Rp 3.100.000', time: '15:05' },
  { id: createTransactionId(), name: 'Tagihan Listrik', type: 'Pengeluaran', amount: '- Rp 1.280.000', time: '18:30' },
  { id: createTransactionId(), name: 'Fee Klien', type: 'Pemasukan', amount: '+ Rp 7.500.000', time: '20:10' },
];

const budget = [
  { name: 'Operasional', percent: 72, color: 'teal' },
  { name: 'Marketing', percent: 54, color: 'violet' },
  { name: 'Payroll', percent: 89, color: 'gold' },
];

const parseAmount = (amount) => {
  const raw = String(amount)
    .replace(/Rp/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    .trim();

  const normalized = raw.startsWith('+') || raw.startsWith('-')
    ? raw
    : `+${raw}`;

  const sign = normalized.startsWith('-') ? -1 : 1;
  const value = Number(normalized.replace(/[+\-]/g, ''));

  return sign * value;
};

const formatCurrency = (value) => `Rp ${Math.abs(value).toLocaleString('id-ID')}`;

const STORAGE_KEY = 'financeflow-dashboard-state';

const loadStoredState = () => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Gagal membaca data dashboard', error);
    return null;
  }
};

export default function App() {
  const [period, setPeriod] = useState('Bulan');
  const [transactionType, setTransactionType] = useState('Semua');
  const [transactions, setTransactions] = useState(() => {
    const stored = loadStoredState();
    return normalizeTransactions(stored?.transactions ?? initialTransactions);
  });
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'Pemasukan', amount: '', note: '' });
  const [monthlyTarget, setMonthlyTarget] = useState(() => {
    const stored = loadStoredState();
    return stored?.monthlyTarget ?? 30000000;
  });

  const profile = periodProfiles[period];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ transactions, monthlyTarget })
    );
  }, [transactions, monthlyTarget]);

  const transactionSummary = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'Pemasukan')
      .reduce((sum, item) => sum + parseAmount(item.amount), 0);

    const expense = transactions
      .filter((item) => item.type === 'Pengeluaran')
      .reduce((sum, item) => sum + Math.abs(parseAmount(item.amount)), 0);

    const savings = transactions
      .filter((item) => item.type === 'Tabungan')
      .reduce((sum, item) => sum + parseAmount(item.amount), 0);

    const balance = income + savings - expense;
    const totalActivity = Math.max(income + savings + expense, 1);

    return {
      income,
      expense,
      savings,
      balance,
      totalActivity,
    };
  }, [transactions]);

  const metrics = [
    {
      label: 'Saldo Total',
      value: formatCurrency(transactionSummary.balance),
      trend: `${transactionSummary.balance >= 0 ? '+' : '-'}${Math.abs(transactionSummary.balance).toLocaleString('id-ID')} dari aktivitas`,
      tone: 'good',
    },
    {
      label: 'Pendapatan Bulan Ini',
      value: formatCurrency(transactionSummary.income),
      trend: `${transactionSummary.income > 0 ? '+' : ''}${Math.round((transactionSummary.income / Math.max(transactionSummary.totalActivity, 1)) * 100)}% dari total aktivitas`,
      tone: 'good',
    },
    {
      label: 'Pengeluaran',
      value: formatCurrency(transactionSummary.expense),
      trend: `${transactionSummary.expense > 0 ? 'Terpakai' : 'Kosong'} dalam daftar`,
      tone: 'warn',
    },
    {
      label: 'Tabungan',
      value: formatCurrency(transactionSummary.savings),
      trend: `${transactionSummary.savings > 0 ? '+' : ''}${Math.round((transactionSummary.savings / Math.max(transactionSummary.totalActivity, 1)) * 100)}% dari total aktivitas`,
      tone: 'good',
    },
  ];

  const budgetUsage = [
    {
      name: 'Operasional',
      percent: Math.min(100, Math.round((transactionSummary.expense / Math.max(transactionSummary.totalActivity, 1)) * 100)),
      color: 'teal',
    },
    {
      name: 'Marketing',
      percent: Math.min(100, Math.round((transactionSummary.income / Math.max(transactionSummary.totalActivity, 1)) * 100)),
      color: 'violet',
    },
    {
      name: 'Payroll',
      percent: Math.min(100, Math.round((transactionSummary.savings / Math.max(transactionSummary.totalActivity, 1)) * 100)),
      color: 'gold',
    },
  ];

  const filteredTransactions = useMemo(() => {
    if (transactionType === 'Semua') return transactions;
    return transactions.filter((item) => item.type === transactionType);
  }, [transactionType, transactions]);

  const monthlyProgress = Math.min(100, Math.max(0, Math.round((transactionSummary.savings / Math.max(monthlyTarget, 1)) * 100)));
  const targetLabel = period === 'Bulan' ? formatCurrency(monthlyTarget) : profile.target;
  const targetProgress = period === 'Bulan' ? monthlyProgress : profile.progress;
  const targetInsight = period === 'Bulan'
    ? `${monthlyProgress}% tercapai dari target tabungan Anda. ${transactionSummary.savings > 0 ? 'Anda sudah mendekati target.' : 'Tambahkan pemasukan atau hemat lebih banyak untuk menaikkan progress.'}`
    : profile.insight;

  const visibleTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 4);

  const suggestedTips = useMemo(() => {
    const expenseCount = transactions.filter((item) => item.type === 'Pengeluaran').length;
    const incomeCount = transactions.filter((item) => item.type === 'Pemasukan').length;
    const savingsRatio = transactionSummary.savings / Math.max(monthlyTarget, 1);
    const expenseRatio = transactionSummary.expense / Math.max(transactionSummary.income + transactionSummary.savings, 1);

    const tips = [];

    if (expenseRatio > 0.6) {
      tips.push('Pengeluaran Anda cukup tinggi dibanding pendapatan. Coba kurangi belanja non-esensial 10% untuk menambah ruang tabungan.');
    } else if (expenseRatio > 0.4) {
      tips.push('Pengeluaran masih dalam batas wajar. Fokuskan penghematan kecil pada belanja rutin agar target lebih aman.');
    } else {
      tips.push('Rasio pengeluaran Anda sehat. Pertahankan kebiasaan hemat agar target bulanan tetap tercapai.');
    }

    if (savingsRatio < 0.35) {
      tips.push(`Target tabungan Anda masih belum cukup. Coba alokasikan minimal ${formatCurrency(Math.max(500000, Math.round(monthlyTarget * 0.1)))} setiap minggu untuk mempercepat progress.`);
    } else {
      tips.push('Progress tabungan Anda sudah bagus. Tetapkan transfer otomatis bulanan agar target tetap konsisten.');
    }

    if (expenseCount >= 2) {
      tips.push('Anda memiliki beberapa pengeluaran aktif. Tinjau tagihan atau belanja berulang untuk menemukan potensi hemat yang bisa dipangkas.');
    }

    if (incomeCount === 0 && transactionSummary.income === 0) {
      tips.push('Belum ada pemasukan yang tercatat. Tambahkan transaksi pemasukan agar dashboard bisa memberi gambaran target yang lebih akurat.');
    }

    if (tips.length < 3) {
      tips.push('Gunakan filter transaksi untuk melihat pola pengeluaran dan keputusan mana yang paling memberi dampak besar pada tabungan.');
    }

    return tips.slice(0, 3);
  }, [monthlyTarget, transactionSummary, transactions]);

  const actionPlan = useMemo(() => {
    const weeklySaving = Math.max(500000, Math.round(monthlyTarget * 0.1));

    return [
      {
        title: 'Kurangi belanja non-esensial 10%',
        detail: 'Tinjau pengeluaran rutin dan potong kebiasaan belanja yang tidak memberi dampak penting pada produktivitas.',
      },
      {
        title: 'Tetapkan transfer otomatis mingguan',
        detail: `Alokasikan minimal ${formatCurrency(weeklySaving)} setiap minggu agar target tabungan tetap aman dan konsisten.`,
      },
      {
        title: 'Review tagihan dan pemasukan tambahan',
        detail: 'Periksa tagihan berulang, lalu cari satu sumber pemasukan tambahan atau penghematan yang bisa langsung diterapkan.',
      },
    ];
  }, [monthlyTarget]);

  const handleStartEditTransaction = (item) => {
    setEditingTransactionId(item.id);
    setFormData({
      name: item.name,
      type: item.type,
      amount: String(Math.abs(parseAmount(item.amount))),
      note: item.note ?? '',
    });
    setShowAddForm(true);
    setShowAllTransactions(true);
    setTransactionType('Semua');
  };

  const handleAddTransaction = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.amount.trim()) {
      return;
    }

    const sign = formData.type === 'Pengeluaran' ? -1 : 1;
    const amountValue = sign * Number(formData.amount);
    const formattedAmount = `${amountValue >= 0 ? '+' : '-'} Rp ${Math.abs(amountValue).toLocaleString('id-ID')}`;

    if (editingTransactionId) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editingTransactionId
            ? {
                ...item,
                name: formData.name.trim(),
                type: formData.type,
                amount: formattedAmount,
                note: formData.note.trim(),
              }
            : item
        )
      );
      setEditingTransactionId(null);
    } else {
      const nextTransaction = {
        id: createTransactionId(),
        name: formData.name.trim(),
        type: formData.type,
        amount: formattedAmount,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        note: formData.note.trim(),
      };

      setTransactions((current) => [nextTransaction, ...current]);
    }

    setFormData({ name: '', type: 'Pemasukan', amount: '', note: '' });
    setShowAddForm(false);
    setTransactionType('Semua');
    setShowAllTransactions(true);
  };

  const handleDeleteTransaction = (targetId) => {
    setTransactions((current) => current.filter((item) => item.id !== targetId));
  };

  const handleResetDemo = () => {
    const resetTransactions = normalizeTransactions(initialTransactions);
    setTransactions(resetTransactions);
    setMonthlyTarget(30000000);
    setEditingTransactionId(null);
    setShowAddForm(false);
    setShowActionPlan(false);
    setTransactionType('Semua');
    setShowAllTransactions(false);
  };

  return (
    <main className="app-shell">
      <section className="hero-card glass-card">
        <div>
          <p className="eyebrow">FinanceFlow</p>
          <h1>Dashboard keuangan yang lebih tajam, lebih rapi, dan siap membantu keputusan cepat.</h1>
          <p className="subtle-text">
            Pantau arus kas, pengeluaran, tabungan, dan target Anda dengan tampilan modern, ringkas, dan mudah dipahami.
          </p>
          <div className="control-block">
            <p className="control-label">Periode</p>
            <div className="toggle-row">
              {Object.keys(periodProfiles).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`toggle-btn ${period === item ? 'active' : ''}`}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="chip-row">
            <span className="chip">📈 Growth +18%</span>
            <span className="chip">💳 {filteredTransactions.length} transaksi terlihat</span>
            <span className="chip">🧠 {profile.label} aktif</span>
            <span className="chip highlight-chip">✨ Fokus hemat bulan ini</span>
          </div>

          <div className="quick-actions">
            <button className="ghost-btn" type="button" onClick={() => {
              setEditingTransactionId(null);
              setFormData({ name: '', type: 'Pemasukan', amount: '', note: '' });
              setShowAddForm((value) => !value);
            }}>
              {showAddForm ? 'Tutup form' : 'Tambah transaksi'}
            </button>
            <button className="ghost-btn" type="button" onClick={handleResetDemo}>
              Reset demo
            </button>
          </div>
        </div>

        <aside className="mini-spotlight">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="spotlight-panel">
            <p>Target {profile.label}</p>
            <strong>{targetLabel}</strong>
            <div className="progress-track"><span style={{ width: `${targetProgress}%` }} /></div>
            {period === 'Bulan' && (
              <label className="target-editor">
                <span>Ubah target bulanan (Rp)</span>
                <input
                  type="number"
                  min="1"
                  value={monthlyTarget}
                  onChange={(event) => setMonthlyTarget(Number(event.target.value) || 0)}
                />
              </label>
            )}
            <small>{targetInsight}</small>
          </div>
        </aside>
      </section>

      <section className="stats-grid">
        {metrics.map((item) => (
          <article className="glass-card metric-card" key={item.label}>
            <p>{item.label}</p>
            <h2>{item.value}</h2>
            <span className={`trend ${item.tone}`}>{item.trend} vs bulan lalu</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="glass-card panel-card">
          <header className="panel-head">
            <div>
              <p className="eyebrow">Ringkasan</p>
              <h3>Alokasi anggaran</h3>
            </div>
            <button className="ghost-btn" type="button" onClick={() => setShowAddForm((value) => !value)}>
              {showAddForm ? 'Tutup' : '+ Tambah'}
            </button>
          </header>

          {showAddForm && (
            <form className="add-form" onSubmit={handleAddTransaction}>
              <p className="subtle-text">Perubahan Anda otomatis tersimpan di browser dan tetap ada saat Anda kembali ke halaman ini.</p>
              <label>
                Kegiatan
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Contoh: Belanja bulanan"
                />
              </label>
              <label>
                Jenis
                <select
                  value={formData.type}
                  onChange={(event) => setFormData((current) => ({ ...current, type: event.target.value }))}
                >
                  <option>Pemasukan</option>
                  <option>Pengeluaran</option>
                  <option>Tabungan</option>
                </select>
              </label>
              <label>
                Nominal (Rp)
                <input
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="1500000"
                />
              </label>
              <label>
                Catatan
                <input
                  type="text"
                  value={formData.note}
                  onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Opsional"
                />
              </label>
              <div className="quick-actions">
                <button className="primary-btn" type="submit">{editingTransactionId ? 'Simpan perubahan' : 'Simpan aktivitas'}</button>
                {editingTransactionId && (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => {
                      setEditingTransactionId(null);
                      setFormData({ name: '', type: 'Pemasukan', amount: '', note: '' });
                      setShowAddForm(false);
                    }}
                  >
                    Batal edit
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="chart-area">
            <div className="main-chart">
              {[
                { label: 'Pendapatan', value: transactionSummary.income, color: 'bar-a', tone: 'teal' },
                { label: 'Pengeluaran', value: transactionSummary.expense, color: 'bar-b', tone: 'violet' },
                { label: 'Tabungan', value: transactionSummary.savings, color: 'bar-c', tone: 'gold' },
                { label: 'Saldo', value: transactionSummary.balance, color: 'bar-d', tone: 'sky' },
              ].map((item) => {
                const height = Math.max(10, Math.min(100, (Math.abs(item.value) / Math.max(transactionSummary.totalActivity, 1)) * 140));
                return (
                  <div
                    key={item.label}
                    className={`bar ${item.color}`}
                    title={`${item.label}: ${formatCurrency(item.value)}`}
                    style={{ height: `${height}%`, background: item.label === 'Pendapatan' ? 'linear-gradient(180deg, #2dd4bf, #38bdf8)' : item.label === 'Pengeluaran' ? 'linear-gradient(180deg, #c084fc, #818cf8)' : item.label === 'Tabungan' ? 'linear-gradient(180deg, #fbbf24, #fb7185)' : 'linear-gradient(180deg, #38bdf8, #a78bfa)' }}
                  />
                );
              })}
            </div>
            <ul className="legend-list">
              <li><span className="dot dot-teal" /> Pendapatan</li>
              <li><span className="dot dot-violet" /> Pengeluaran</li>
              <li><span className="dot dot-gold" /> Tabungan</li>
            </ul>
          </div>
        </article>

        <article className="glass-card panel-card">
          <header className="panel-head">
            <div>
              <p className="eyebrow">Budget</p>
              <h3>Persentase penggunaan</h3>
            </div>
            <span className="badge">Live</span>
          </header>
          <div className="budget-stack">
            {budgetUsage.map((item) => (
              <div className="budget-row" key={item.name}>
                <div className="budget-label-row">
                  <strong>{item.name}</strong>
                  <span>{item.percent}%</span>
                </div>
                <div className="progress-track"><span className={`fill ${item.color}`} style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid lower-grid">
        <article className="glass-card panel-card">
          <header className="panel-head">
            <div>
              <p className="eyebrow">Aktivitas</p>
              <h3>Transaksi terbaru</h3>
            </div>
            <button
              className="ghost-btn"
              type="button"
              onClick={() => setShowAllTransactions((value) => !value)}
            >
              {showAllTransactions ? 'Tutup daftar' : 'Lihat semua'}
            </button>
          </header>
          <div className="filter-row">
            {['Semua', 'Pemasukan', 'Pengeluaran', 'Tabungan'].map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-chip ${transactionType === item ? 'active' : ''}`}
                onClick={() => setTransactionType(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="transaction-list">
            {visibleTransactions.map((item) => (
              <article className="transaction-card" key={`${item.name}-${item.time}-${item.amount}`}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.type}{item.note ? ` · ${item.note}` : ''}</p>
                </div>
                <div className="transaction-meta">
                  <strong>{item.amount}</strong>
                  <span>{item.time}</span>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleStartEditTransaction(item)}
                    aria-label={`Ubah transaksi ${item.name}`}
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteTransaction(item.id)}
                    aria-label={`Hapus transaksi ${item.name}`}
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
            {!showAllTransactions && filteredTransactions.length > 4 && (
              <button className="ghost-btn full-width-btn" type="button" onClick={() => setShowAllTransactions(true)}>
                Tampilkan semua {filteredTransactions.length} transaksi
              </button>
            )}
          </div>
        </article>

        <article className="glass-card panel-card tip-card">
          <p className="eyebrow">Tips</p>
          <h3>Strategi hemat bulan ini</h3>
          <ul>
            {suggestedTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowActionPlan((value) => !value)}
          >
            {showActionPlan ? 'Saran sedang aktif' : 'Jalankan saran'}
          </button>

          {showActionPlan && (
            <section className="action-plan-card" aria-live="polite">
              <h4>Langkah yang bisa Anda lakukan sekarang</h4>
              <ol>
                {actionPlan.map((step) => (
                  <li key={step.title}>
                    <strong>{step.title}</strong>
                    <span>{step.detail}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>
      </section>
    </main>
  );
}
