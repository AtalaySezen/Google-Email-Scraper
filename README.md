# Google Email Scraper v2.0

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D14.0-brightgreen.svg?style=flat-square)
![Puppeteer](https://img.shields.io/badge/Puppeteer-Extra-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)

> **Advanced, stealthy, and automated.** > *Gelişmiş, gizli ve tam otomatik.*

This is the **v2.0** major update of the Google Email Scraper. It allows you to scrape email addresses from Google search results based on your keywords, automatically saving them into organized Excel files.

*Bu proje, Google Email Scraper'ın **v2.0** güncellemesidir. Anahtar kelimelerinize göre Google arama sonuçlarını tarayarak e-posta adreslerini bulur ve bunları düzenli Excel dosyalarına kaydeder.*

---

## New Features in v2.0 (Yenilikler)

- **Stealth Mode:** Uses `puppeteer-extra-plugin-stealth` to bypass Google bot detection and CAPTCHAs. (*Google bot korumasını aşmak için gizlilik modunu kullanır.*)
- **Session Persistence:** Creates a `chrome_profile` folder to save your Google session and cookies. You don't need to log in every time! (*Oturumunuzu kaydeder, her seferinde giriş yapmanız gerekmez.*)
- **Excel Export:** No more messy text files! Results are saved as clean `.xlsx` files. (*Sonuçlar artık karmaşık txt dosyaları yerine Excel olarak kaydedilir.*)
- **Smart Search:** Automatically detects and visits "Contact" pages if no email is found on the homepage. (*Ana sayfada mail yoksa İletişim sayfalarını bulup tarar.*)
- **Human-Like Behavior:** Mimics real user interactions (mouse moves, random delays) to avoid getting blocked. (*Robot gibi davranmaz, gerçek kullanıcıyı taklit eder.*)
- **⏯Resume Capability:** Remembers searched keywords in `searched_keywords.txt` so you can stop and resume anytime. (*Kaldığı yeri hatırlar, aynı kelimeleri tekrar aramaz.*)

---

## 🛠️ Installation (Kurulum)

1. **Clone the repository (Projeyi indirin):**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/google-email-scraper.git](https://github.com/YOUR_USERNAME/google-email-scraper.git)
   cd google-email-scraper