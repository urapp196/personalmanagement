import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from './App';

const STORAGE_KEY = 'financeflow-dashboard-state';

beforeEach(() => {
  window.localStorage.clear();
});

const loginToDashboard = async (user) => {
  render(<App />);

  fireEvent.change(screen.getByLabelText(/nama/i), { target: { value: 'Fhilip' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'fhilip@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'rahasia' } });
  await user.click(screen.getByRole('button', { name: /masuk ke dashboard/i }));
};

describe('Tips strategi bulan ini', () => {
  it('menampilkan daftar langkah saat tombol jalankan saran diklik', async () => {
    const user = userEvent.setup();
    await loginToDashboard(user);

    await user.click(screen.getByRole('button', { name: /jalankan saran/i }));

    expect(screen.getByText('Langkah yang bisa Anda lakukan sekarang')).toBeInTheDocument();
    expect(screen.getByText(/kurangi belanja non-esensial/i)).toBeInTheDocument();
    expect(screen.getByText(/tetapkan transfer otomatis/i)).toBeInTheDocument();
  });

  it('memungkinkan pengguna mengubah transaksi yang sudah tersimpan', async () => {
    const user = userEvent.setup();
    await loginToDashboard(user);

    await user.click(screen.getByRole('button', { name: /tambah transaksi/i }));
    fireEvent.change(screen.getByLabelText(/kegiatan/i), { target: { value: 'Bonus proyek' } });
    fireEvent.change(screen.getByLabelText(/jenis/i), { target: { value: 'Pemasukan' } });
    fireEvent.change(screen.getByLabelText(/nominal \(rp\)/i), { target: { value: '2500000' } });
    fireEvent.change(screen.getByLabelText(/catatan/i), { target: { value: 'Tambahan' } });
    await user.click(screen.getByRole('button', { name: /simpan aktivitas/i }));

    const editButton = await screen.findByRole('button', { name: /ubah transaksi bonus proyek/i });
    await user.click(editButton);

    fireEvent.change(screen.getByLabelText(/kegiatan/i), { target: { value: 'Bonus proyek final' } });
    fireEvent.change(screen.getByLabelText(/nominal \(rp\)/i), { target: { value: '3000000' } });
    await user.click(screen.getByRole('button', { name: /simpan perubahan/i }));

    expect(await screen.findByText('Bonus proyek final')).toBeInTheDocument();
    expect(screen.getByText('+ Rp 3.000.000')).toBeInTheDocument();

    const saved = window.localStorage.getItem(STORAGE_KEY);
    expect(saved).toContain('Bonus proyek final');
    expect(saved).toContain('3000000');
  });

  it('menampilkan bagian akun setelah login dan bisa keluar', async () => {
    const user = userEvent.setup();
    await loginToDashboard(user);

    expect(screen.getByLabelText(/akun pengguna/i)).toBeInTheDocument();
    expect(screen.getByText('Fhilip')).toBeInTheDocument();
    expect(screen.getByText('fhilip@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /keluar/i }));

    expect(screen.getByRole('button', { name: /masuk ke dashboard/i })).toBeInTheDocument();
  });
});
