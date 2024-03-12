const puppeteer = require("puppeteer");
const siteUrl = "https://motosikletgezirotalari.net/";
const visitedPages = new Set();
const foundEmailsSet = new Set();

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

  const foundEmails = Array.from(foundEmailsSet);

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

  if (!url.includes(siteUrl)) {
    return;
  }

  visitedPages.add(url);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    console.log(`Sayfa ziyaret edildi - ${url}`);
    const entirePageContent = await page.content();
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const foundEmailsOnPage = entirePageContent.match(emailRegex);

    if (foundEmailsOnPage) {
      foundEmailsOnPage.forEach((email) => foundEmailsSet.add(email));
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
