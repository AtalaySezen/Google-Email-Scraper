const puppeteer = require("puppeteer");
const fs = require("fs");

async function isBlocked(page) {
  const url = page.url();
  return url.toLowerCase().includes("sorry");
}

async function blockWait(page, milliseconds) {
  await page.evaluate((ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }, milliseconds);
}

function findDuplicatedEmails(emailSet, email) {
  return emailSet.has(email);
}

async function scrapeEmailsFromGoogle(keyword, maxResults) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  });
  const page = await browser.newPage();

  try {
    let emailsSet = new Set();
    let visitedSites = [];
    let totalResults = 0;
    let currentPage = 1;
    while (totalResults < maxResults) {
      await page.goto(
        `https://www.google.com/search?q=${keyword}&start=${
          (currentPage - 1) * 10
        }`
      );

      if (await isBlocked(page)) {
        console.log("Engelleme algılandı. Bekleniyor...");
        await blockWait(page, 10000);
        continue;
      }

      const siteURLs = await page.$$eval("div.yuRUbf a", (elements) =>
        elements.map((element) => element.href)
      );
      console.log(siteURLs, "siteurl");
      visitedSites.push(...siteURLs);

      for (const siteURL of siteURLs) {
        try {
          await page.goto(siteURL);
          const content = await page.content();
          const emailRegex =
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
          const pageEmails = content.match(emailRegex) || [];
          pageEmails.forEach((email) => {
            const strongEmailRegex =
              /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?![\w\W]*\.png$))/g;
            if (strongEmailRegex.test(email)) {
              if (!findDuplicatedEmails(emailsSet, email)) {
                emailsSet.add(email);
                fs.appendFileSync(`${keyword}.txt`, email + "\n");
              }
            }
          });
        } catch (error) {
          console.error(`Siteye gitme hatası: ${siteURL}`, error);
          continue;
        }
      }

      totalResults += siteURLs.length;
      currentPage++;
    }

    const emails = [...emailsSet];
    return { emails, visitedSites };
  } catch (error) {
    throw error;
  } finally {
    await browser.close();
  }
}

const keyword = "write your keyword here";
const maxResults = 200;

scrapeEmailsFromGoogle(keyword, maxResults)
  .then(({ emails, visitedSites }) => {
    console.log("Bulunan E-posta Adresleri:");
    console.log(emails);
    console.log("Ziyaret Edilen Siteler:");
    console.log(visitedSites);
    console.log("E-posta adresleri emails.txt dosyasına yazıldı.");
  })
  .catch((error) => {
    console.error("Hata oluştu:", error);
  });
