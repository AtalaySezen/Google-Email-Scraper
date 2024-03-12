  const puppeteer = require("puppeteer");

  const siteUrl = "https://www.rafineyapim.com/";
  const visitedPages = new Set();

  async function scrapeAllPages(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      await scrapePage(page, url);
    } catch (error) {
      console.error("Hata oluştu:", error);
    } finally {
      await browser.close();
    }
  }

  async function scrapePage(page, url) {
    if (visitedPages.has(url)) {
      console.log(`Sayfa zaten ziyaret edildi - ${url}`);
      return;
    }

    visitedPages.add(url);

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Aramak istediğiniz metni kontrol etmek için page içeriğini alabilirsiniz
    const entirePageContent = await page.content();
    const searchText = "e-posta";

    if (entirePageContent.includes(searchText)) {
      console.log(`Aranan metin bulundu - Sayfa: ${url}`);

      // Eğer e-posta adresi varsa, basit bir regex kullanarak bulabilirsiniz
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const foundEmails = entirePageContent.match(emailRegex);

      if (foundEmails) {
        console.log("Bulunan E-posta Adresi:", foundEmails[0]);
      } else {
        console.log("E-posta adresi bulunamadı.");
      }
    } else {
      console.log(`Aranan metin bulunamadı - Sayfa: ${url}`);
    }

    // Sayfadaki tüm linkleri al
    const links = await page.$$eval("a", (anchors) =>
      anchors.map((anchor) => anchor.href)
    );

    // Alınan linkleri dolaşarak işlemi tekrarla
    for (const link of links) {
      // mailto bağlantılarını kontrol et
      if (link.startsWith("mailto:")) {
        console.log(`E-posta bağlantısı bulundu: ${link}`);
      } else {
        await scrapePage(page, link);
      }
    }
  }

  // Top-level await kullanımı için özel bir fonksiyon
  (async () => {
    await scrapeAllPages(siteUrl);
  })();
