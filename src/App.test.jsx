import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

const STORAGE_KEY = 'financeflow-dashboard-state';

beforeEach(() => {
  window.localStorage.clear();
});

describe('Tips strategi bulan ini', () => {
  it('menampilkan daftar langkah saat tombol jalankan saran diklik', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /jalankan saran/i }));

    expect(screen.getByText('Langkah yang bisa Anda lakukan sekarang')).toBeInTheDocument();
    expect(screen.getByText(/kurangi belanja non-esensial/i)).toBeInTheDocument();
    expect(screen.getByText(/tetapkan transfer otomatis/i)).toBeInTheDocument();
  });

  it('memungkinkan pengguna mengubah transaksi yang sudah tersimpan', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /tambah transaksi/i }));
    await user.type(screen.getByLabelText(/kegiatan/i), 'Bonus proyek');
    await user.selectOptions(screen.getByLabelText(/jenis/i), 'Pemasukan');
    await user.type(screen.getByLabelText(/nominal \(rp\)/i), '2500000');
    await user.type(screen.getByLabelText(/catatan/i), 'Tambahan');
    await user.click(screen.getByRole('button', { name: /simpan aktivitas/i }));

    const editButton = await screen.findByRole('button', { name: /ubah transaksi bonus proyek/i });
    await user.click(editButton);

    await user.clear(screen.getByLabelText(/kegiatan/i));
    await user.type(screen.getByLabelText(/kegiatan/i), 'Bonus proyek final');
    await user.clear(screen.getByLabelText(/nominal \(rp\)/i));
    await user.type(screen.getByLabelText(/nominal \(rp\)/i), '3000000');
    await user.click(screen.getByRole('button', { name: /simpan perubahan/i }));

    expect(await screen.findByText('Bonus proyek final')).toBeInTheDocument();
    expect(screen.getByText('+ Rp 3.000.000')).toBeInTheDocument();

    const saved = window.localStorage.getItem(STORAGE_KEY);
    expect(saved).toContain('Bonus proyek final');
    expect(saved).toContain('3000000');
  });
});
