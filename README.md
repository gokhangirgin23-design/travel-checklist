# 🧳 Travel Checklist PWA

GitHub Pages üzerinde çalışan, tamamen statik (backend gerektirmeyen), offline destekli, modern bir valiz hazırlama checklist uygulaması.

- İlk açılışta `checklist.md` dosyasını okur
- Tüm değişiklikler `localStorage` üzerinde saklanır
- iPhone / Android / Desktop — hepsinde çalışır
- Ana ekrana eklenince uygulama gibi açılır (PWA)
- İnternet olmadan çalışır (Service Worker)
- Light / Dark mode (otomatik + manuel)
- Markdown içe/dışa aktarma

---

## 🚀 GitHub Pages Kurulumu

### 1. Repo oluşturma

1. [github.com/new](https://github.com/new) adresine git.
2. Repository name: `travel-checklist` (istediğin ismi verebilirsin).
3. **Public** seç ve **Create repository** butonuna tıkla.

### 2. Dosyaları yükleme

**Yöntem A — Tarayıcıdan (en kolay):**

1. Repo sayfasında **Add file → Upload files**.
2. Bu klasördeki **tüm dosyaları** (`icons/` klasörü dahil) sürükle-bırak.
3. **Commit changes** butonuna tıkla.

**Yöntem B — Git ile:**

```bash
git clone https://github.com/KULLANICI_ADIN/travel-checklist.git
cd travel-checklist
# dosyaları bu klasöre kopyala, sonra:
git add .
git commit -m "Travel Checklist PWA"
git push origin main
```

### 3. Pages'i açma

1. Repo sayfasında **Settings → Pages** sekmesine git.
2. **Source**: `Deploy from a branch` seç.
3. **Branch**: `main` ve klasör olarak `/ (root)` seç, **Save**'e tıkla.
4. 1-2 dakika sonra uygulaman şu adreste yayında olur:

```
https://KULLANICI_ADIN.github.io/travel-checklist/
```

---

## 📱 iPhone'da Ana Ekrana Ekleme

1. **Safari** ile uygulama adresini aç.
2. Alttaki **Paylaş** butonuna (kare + yukarı ok) dokun.
3. **Ana Ekrana Ekle**'yi seç.
4. **Ekle**'ye dokun.

Artık ana ekrandaki ikona dokununca tam ekran, uygulama gibi açılır. İlk açılıştan sonra internet olmadan da çalışır.

> Android'de: Chrome → menü (⋮) → **Ana ekrana ekle**.

---

## ✏️ Varsayılan Listeyi (checklist.md) Güncelleme

1. Repoda `checklist.md` dosyasını aç, kalem ikonuyla düzenle ve commit et.
2. Format:

```markdown
# 👕 Kategori Adı

- Madde 1
- Madde 2
```

> **Not:** Uygulamayı daha önce açtıysan verilerin `localStorage`'da saklanır ve yeni `checklist.md` otomatik yüklenmez. Yeni listeyi görmek için uygulamada **Ayarlar → Varsayılan Listeye Dön** butonunu kullan.

---

## 📤 Markdown İçe / Dışa Aktarma

- **Markdown İndir** (Ayarlar): O anki listenin tamamını (işaret durumlarıyla birlikte, `- [x]` formatında) `checklist.md` olarak indirir.
- **Markdown Yükle** (Ayarlar): Telefondan veya bilgisayardan seçilen bir markdown dosyasını yükler ve mevcut listeyi onunla değiştirir. `- Madde` ve `- [x] Madde` formatlarının ikisi de desteklenir.
- **Varsayılan Listeye Dön** (Ayarlar): localStorage temizlenir ve repodaki `checklist.md` yeniden okunur.

---

## 🛠 Teknolojiler

HTML5 · CSS3 · Vanilla JavaScript (ES6+) · PWA (Service Worker + Manifest) · localStorage · GitHub Pages

Framework yok, bağımlılık yok, build adımı yok.
