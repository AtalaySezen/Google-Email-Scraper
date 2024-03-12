const puppeteer = require("puppeteer");
const siteUrl = "https://motosikletgezirotalari.net";
const visitedPages = new Set();

async function scrapeAllPages(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await scrapePage(page, url);
  } catch (error) {
    return false;
  } finally {
    await browser.close();
  }
}

async function scrapePage(page, url) {
  if (visitedPages.has(url)) {
    return;
  }

  visitedPages.add(url);
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const entirePageContent = await page.content();
  const searchText = "e-posta";

  if (entirePageContent.includes(searchText)) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const foundEmails = entirePageContent.match(emailRegex);

    if (foundEmails) {
      console.log("Bulunan E-posta Adresi:", foundEmails[0]);
    } else {
      console.log("E-posta adresi bulunamadı.");
    }
  } else {
  }

  const links = await page.$$eval("a", (anchors) =>
    anchors.map((anchor) => anchor.href)
  );

  for (const link of links) {
    if (link.startsWith("mailto:")) {
      console.log(`E-posta bağlantısı bulundu: ${link}`);
    } else {
      await scrapePage(page, link);
    }
  }
}

(async () => {
  await scrapeAllPages(siteUrl);
})();
