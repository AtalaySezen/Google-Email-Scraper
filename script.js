const puppeteer = require("puppeteer");
const siteUrl = "https://www.aigtur.com.tr/";
const visitedPages = new Set();

let lastFoundEmail = null;

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

  if (lastFoundEmail !== null) {
    console.log(lastFoundEmail);
  } else {
    console.log("E-posta adresi bulunamadı.");
  }
}

async function scrapePage(page, url) {
  if (visitedPages.has(url)) {
    return;
  }
  visitedPages.add(url);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    console.log(`Sayfa ziyaret edildi - ${url}`);
    const entirePageContent = await page.content();
    const searchText = "e-posta";

    if (entirePageContent.includes(searchText)) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
      const foundEmails = entirePageContent.match(emailRegex);

      if (foundEmails) {
        lastFoundEmail = foundEmails[0];
        console.log("Bulunan E-posta Adresi:", foundEmails[0]);
      }
    }

    const links = await page.$$eval("a", (anchors) =>
      anchors.map((anchor) => anchor.href)
    );

    for (const link of links) {
      if (link.startsWith("mailto:")) {
        lastFoundEmail = link;
        console.log(`E-posta bağlantısı bulundu: ${link}`);
      } else {
        await scrapePage(page, link);
      }
    }
  } catch (error) {
    // console.error("Hata oluştu:", error);
  }
}

(async () => {
  await scrapeAllPages(siteUrl);
})();