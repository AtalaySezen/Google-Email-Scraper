const puppeteer = require("puppeteer");
const siteUrl = "https://motosikletgezirotalari.net/";
const targetDomain = "motosikletgezirotalari.net";
const visitedPages = new Set();

let foundEmails = [];

async function scrapeAllPages(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await scrapePage(page, url);
  } catch (error) {
    // console.error("Hata oluştu:", error);
  } finally {
    await browser.close();
  }

  if (foundEmails.length > 0) {
    console.log("Bulunan E-posta Adresleri:", foundEmails);
  } else {
    console.log("E-posta adresi bulunamadı.");
  }
}

async function scrapePage(page, url) {
  if (visitedPages.has(url)) {
    return;
  }

  // Sadece belirli bir domain altındaki linkleri kontrol et
  if (!url.includes(targetDomain)) {
    return;
  }

  visitedPages.add(url);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    console.log(`Sayfa ziyaret edildi - ${url}`);
    const entirePageContent = await page.content();
    const searchText = "e-posta";

      console.log("girdim");
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      const foundEmailsOnPage = entirePageContent.match(emailRegex);
      
      if (foundEmailsOnPage) {
        foundEmails = [...foundEmails, ...foundEmailsOnPage];
        console.log("Bulunan E-posta Adresleri:", foundEmailsOnPage);
      }

    const links = await page.$$eval("a", (anchors) =>
      anchors.map((anchor) => anchor.href)
    );

    for (const link of links) {
      await scrapePage(page, link);
    }
  } catch (error) {
    // console.error(`Hata oluştu - ${url}:`, error);
  }
}

(async () => {
  await scrapeAllPages(siteUrl);
})();