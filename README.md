# BAL Topluluk

Mahallenin topluluk platformu ve dijital panosu. Kulüpleri keşfet, yaklaşan
etkinlikleri gör, hesap açmadan panoya duyuru, etkinlik, soru veya genel not
bırak.

Next.js 15.5 (App Router) + Express 5 + better-sqlite3. Web `3000`, API `4600`
portunda çalışır; Next `/api/*` isteklerini Express'e proxy'ler.

## Özellikler

- **Topluluklar:** kategori, açıklama, buluşma notu, iletişim, gönderi ve
  yaklaşan etkinlik sayıları.
- **Dijital pano:** kategori filtreleri, sabitlenmiş gönderiler, sayfalama,
  isim + başlık + mesaj + kategori ile hesapsız paylaşım.
- **Etkinlikler:** yalnızca yaklaşan etkinlikler, başlangıç zamanına göre sıralı.
- **Yönetim:** `ADMIN_TOKEN` ile korunan sayfada gönderi sabitleme/kaldırma,
  gönderi ve etkinlik silme, topluluk ve etkinlik ekleme.
- **Güvenlik:** IP başına saatlik gönderi limiti, honeypot, sunucu tarafı
  doğrulama, sabit uzunlukta token karşılaştırması, güvenli hata zarfları.
- **Arayüz:** Türkçe, açık tema, mobil öncelikli, klavye erişilebilir.

## Kurulum

```bash
pnpm install
cp .env.example .env   # ADMIN_TOKEN değerini değiştir
pnpm seed              # 6 topluluk, 8 gönderi (2 sabit), 3 etkinlik
pnpm dev               # Next 3000 + API 4600
```

`pnpm dev` boş veritabanını otomatik tohumlar. Mevcut veriyi sıfırlamak için
`pnpm seed:reset` kullan (üretimde reddedilir).

### Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `ADMIN_TOKEN` | yok | Yönetim uçları için zorunlu; en az 16 karakter. |
| `API_PORT` | `4600` | Express portu. |
| `API_HOST` | `127.0.0.1` | Express dinleme adresi. |
| `DB_PATH` | `./data/bal-topluluk.db` | SQLite dosyası. |
| `TRUST_PROXY` | `0` | Ters proxy arkasında `1` yapın (gerçek istemci IP'si). |
| `HOST_PORT` | `3000` | Docker'da yayınlanan web portu. |

`ADMIN_TOKEN` üretimde zorunludur. `/admin` sayfasına bu değeri girerek
gönderi sabitleyebilir, silebilir ve yeni topluluk/etkinlik ekleyebilirsin.
Anahtar yalnızca tarayıcı belleğinde tutulur; çerez veya kalıcı depolama
kullanılmaz.

## Komutlar

```bash
pnpm dev            # web + api
pnpm dev:web        # yalnız Next
pnpm dev:api        # yalnız Express
pnpm seed           # demo verisi (dolu veritabanında hata verir)
pnpm seed:reset     # veriyi temizleyip yeniden tohumlar
pnpm smoke          # API uçtan uca smoke testi
pnpm typecheck      # web TypeScript
pnpm typecheck:server # server TypeScript
pnpm lint           # next lint
pnpm check:copy     # Türkçe metinlerde mojibake taraması
pnpm build          # üretim derlemesi
```

## API

Tüm yanıtlar JSON'dur; hatalar
`{ "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "..." } }`
zarfını kullanır.

### Herkese açık

- `GET /api/health`
- `GET /api/clubs` — topluluklar + gönderi/etkinlik sayıları
- `GET /api/clubs/:slug` — topluluk, son gönderiler ve yaklaşan etkinlikler
- `GET /api/board?category=&page=&limit=` — sabitler önce, sonra en yeni;
  `limit` en fazla 50
- `POST /api/board` — `{ authorName, title, body, category, clubSlug?, website? }`
  - IP başına saatte 5 istek
  - ad 2–40, başlık 3–120, mesaj 10–4000 karakter
  - `website` honeypot alanıdır; dolu gelirse istek reddedilir
- `GET /api/events` — yalnızca yaklaşan etkinlikler

### Yönetim

`X-Admin-Token` başlığı zorunludur. Eksik/yanlış anahtar `401`, yapılandırılmamış
sunucu `503` döner.

- `GET /api/admin/session`
- `POST /api/admin/posts` — gönderi oluştur (`pinned` opsiyonel)
- `PATCH /api/admin/posts/:id` — `{ "pinned": true | false }`
- `DELETE /api/admin/posts/:id`
- `POST /api/admin/clubs`
- `POST /api/admin/events`
- `DELETE /api/admin/events/:id`

## Veri modeli

- `clubs`: ad, slug, açıklama, kategori (`müzik`, `spor`, `bilim`, `sanat`,
  `girişim`, `diğer`), buluşma notu, iletişim.
- `posts`: opsiyonel topluluk, yazar adı, başlık, mesaj, kategori (`duyuru`,
  `etkinlik`, `soru`, `genel`), sabit bayrağı.
- `events`: topluluk, başlık, açıklama, başlangıç zamanı (epoch ms), yer.

SQLite WAL, foreign key ve `busy_timeout` açıktır. Şema `server/schema.sql`
dosyasındadır.

## Docker

```bash
cp .env.example .env
# .env içinde ADMIN_TOKEN değerini en az 16 karakterlik rastgele bir değer yap
docker compose up -d --build
docker compose logs -f app
```

- Yalnızca `HOST_PORT` (varsayılan `3000`) yayınlanır; API konteyner içinde
  `127.0.0.1:4600` üzerinde kalır.
- `ADMIN_TOKEN` Compose tarafından zorunlu tutulur; imaja gömülmez.
- SQLite verisi `./data` birimine bağlanır. Linux'ta ilk başlatmadan önce
  `mkdir -p data && sudo chown -R 1000:1000 data` gerekebilir.
- Sağlık kontrolü `http://127.0.0.1:3000/api/health` üzerinden yapılır.
- Next `/api/*` isteklerini aynı konteynerdeki Express'e proxy'ler. API portunu
  değiştirirsen `next.config.mjs` içindeki varsayılanı güncelle ve yeniden
  derle.

## Notlar ve sınırlar

- Rate limit ve sayaçlar süreç içidir; tek örnek (single instance) için
  tasarlandı. Çok örnekli dağıtımda Redis tabanlı bir limiter gerekir.
- Sayfalar Express'i tek doğruluk kaynağı kabul ettiği için istek anında
  (dinamik) render edilir; Express yazımları Next önbelleğinden geçmez.
- Kullanıcı içeriği hiçbir yerde `dangerouslySetInnerHTML` ile basılmaz; React
  metin düğümü olarak render edilir ve HTML otomatik kaçışlanır.
- Demo verisi `server/seed.ts` içindedir; tarihler tohumlama anına göre
  üretilir.
