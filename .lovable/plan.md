## Ringkasan

Proyek saat ini masih template kosong. Zip `nyanmodachi.zip` berisi game virtual cat room lengkap (5 kucing chibi berkeliaran, sistem hunger/mood/affection, evolusi, shop, Privy wallet, night mode, coin, food menu). Rencananya:

1. Import semua source game ke proyek.
2. Terapkan arah visual baru yang kamu pilih: **Warm Sand + Space Mono/Rubik + Floating Minimal HUD**.
3. Rombak komponen UI (bukan mekanik game) supaya konsisten dengan arah tersebut.

---

## Langkah 1 — Import game dari zip

- Ekstrak zip ke `/tmp`, salin ke `/dev-server` **tanpa** `.git`, `bun.lock`, dan `tsconfig.tsbuildinfo` (menjaga git & lock proyek).
- Merge file yang perlu:
  - `src/components/*` (CatRoom, CatStatusPanel, Shop, FoodMenu, HeartParticles, FeedParticles, CatAccessory, CoinBadge, WalletButton) + `src/components/ui/*`.
  - `src/hooks/useCatStatuses.ts`, `useplayer.ts`.
  - `src/lib/*` (catState, evolution, foods, shopItems, sounds, ritualChain, privyAuth.server, utils).
  - `src/integrations/*`, `src/providers/*`, `src/assets/*.asset.json`, `supabase/`.
  - `src/routes/index.tsx` (ganti placeholder ke `<CatRoom />`) & `__root.tsx` (provider Privy + QueryClient).
- Install dependency tambahan: `@privy-io/react-auth`, `@supabase/supabase-js`, `viem`, `jose`, `sonner` (cek yang belum ada di `package.json` sekarang).
- Verifikasi build & preview jalan (game harus muncul dulu sebelum di-redesign).

---

## Langkah 2 — Terapkan design tokens Warm Sand

Update `src/styles.css`:

```text
Palette (oklch approx):
  --background      : #faf8f5   (paper cream)
  --surface / card  : #f0ebe3   (washi)
  --muted           : #e5ddd0
  --accent          : #c9b99a   (sand tan)
  --foreground      : #3a2e22   (deep espresso)
  --primary         : #8b7355   (wood brown)
  --primary-foreground: #faf8f5
  --border          : #d9cfbe
  --ring            : #8b7355
  --success         : #7a8a5c   (matcha)
  --danger          : #b5624a   (terracotta)
Extras:
  --shadow-pin      : 0 6px 18px -8px rgba(80,55,30,0.35)
  --gradient-room   : radial-gradient(120% 80% at 50% 30%, #f5ecdd, #ded1b7)
Dark mode = night mode: geser ke tone kayu gelap + moonlight cream accent.
```

Font loading:
- `bun add @fontsource/space-mono @fontsource/rubik`
- Import di `src/start.ts` atau `__root.tsx`, daftarkan di `@theme`:
  - `--font-display: "Space Mono", monospace`
  - `--font-sans: "Rubik", system-ui`
- Body default `font-sans`, heading & angka (coin, bar %) pakai `font-display`.

---

## Langkah 3 — Redesign komponen (floating minimal)

Bentuk umum: semua HUD adalah "pin" — pill radius besar (`rounded-full`), background `bg-card/85 backdrop-blur`, border `border-accent/40`, shadow `--shadow-pin`. Hover: lift 2px.

- **BrandChip (kiri-atas)** – ikon 🐾 + wordmark Space Mono uppercase + hint kecil Rubik.
- **TopRightCluster** – rangkaian pin ikon 40×40: `CoinBadge` (angka Space Mono, koin flip animation), `WalletButton` (state login/logout dari Privy), `ShopButton` (🛒), `NightToggle` (🌙/☀️, ganti icon + tone).
- **CatStatusPanel (bawah)** – strip horizontal scroll, tiap kucing kartu compact:
  - avatar mini + nama Space Mono, stage badge (label evolusi + emoji aksesori).
  - 3 bar tipis (Hunger / Mood / Affection) dengan warna semantik.
  - Tombol `Feed` (buka FoodMenu popover) & `Pet` inline.
  - Card style: washi paper, sudut membulat, corner tape effect.
- **FoodMenu** – popover kecil di atas card kucing, grid 5 emoji makanan dengan hover tooltip, tombol close.
- **Shop dialog** – pakai `Dialog` shadcn, dibungkus tema washi: judul Space Mono, item grid card dengan preview aksesori dan harga.
- **Toast (`sonner`)** – tema warm sand: `bg-card`, `text-foreground`, border accent.
- **Particles** (`HeartParticles`, `FeedParticles`) – warna disamakan ke primary/success.
- **Night mode overlay** – gradient moonlight lebih halus, tambah bintang tipis.

Pastikan HUD responsif: kluster kanan-atas jadi wrap 2 baris di mobile, panel status jadi carousel snap.

---

## Langkah 4 — Polish & verifikasi

- Cek kucing tetap terlihat (HUD tidak menutupi area tengah).
- Perbarui `<head>` di `__root.tsx` & `index.tsx` (title, description sudah bagus, tinggal konsisten).
- Jalankan `bun run build` untuk memastikan tidak ada import rusak.
- Screenshot preview via Playwright untuk verifikasi visual final (desktop + mobile).

---

## Detail teknis singkat

- Jangan copy `.git`, `bun.lock`, `tsconfig.tsbuildinfo` dari zip.
- `src/routeTree.gen.ts` biarkan Vite plugin regenerate.
- `privyAuth.server.ts` butuh secret `PRIVY_APP_SECRET` — kalau belum ada, sisakan tapi tampilkan wallet button dalam mode "connect" saja (tidak crash saat unauth).
- Semua warna komponen shadcn otomatis ikut token baru — tidak ada `text-white`/`bg-black` hard-coded yang perlu diburu setelah tokens diganti (akan di-audit saat implementasi).
