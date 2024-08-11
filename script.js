const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const keywordsFilePath = "keywords.txt";
const searchedKeywordsFilePath = "searched_keywords.txt";

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

function readKeywords(filePath) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, "utf8");
    return data.split("\n").filter(Boolean);
  }
  return [];
}

function saveKeyword(keyword, filePath) {
  fs.appendFileSync(filePath, keyword + "\n");
}

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

async function scrapeEmailsFromGoogle(keyword) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  });
  const page = await browser.newPage();

  let workbook = new ExcelJS.Workbook();
  let worksheet = workbook.addWorksheet("Emails");
  worksheet.columns = [{ header: "Email", key: "email", width: 50 }];
  let excelFileCount = 1;
  let rowCount = 0;

  try {
    let emailsSet = new Set();
    let visitedSites = [];
    let currentPage = 1;
    let noMoreResults = false;

    const sanitizedKeyword = sanitizeFilename(keyword);

    while (!noMoreResults) {
      await page.goto(
        `https://www.google.com/search?q=${keyword}&start=${
          (currentPage - 1) * 10
        }`
      );

      if (await isBlocked(page)) {
        console.log("Blocking detected. Waiting....");
        await blockWait(page, 10000);
        continue;
      }

      const siteURLs = await page.$$eval("div.yuRUbf a", (elements) =>
        elements.map((element) => element.href)
      );

      if (siteURLs.length === 0) {
        console.log(`No more results found for "${keyword}".`);
        noMoreResults = true;
        continue;
      }

      visitedSites.push(...siteURLs);

      for (const siteURL of siteURLs) {
        const restrictedSites = [
          "coraltatil.com",
          "jollytur.com",
          ".tripadvisor.com",
          "https://www.trendyol.com/",
          "https://otelz.com/",
          "https://www.hepsiburada.com/",
          "https://www.n11.com/",
          "https://amazon.com.tr/",
          "https://www.isbank.com.tr/",
          "https://www.garantibbva.com.tr/",
          "https://www.teb.com.tr/",
          "https://www.akbank.com/tr-tr",
          "https://www.ciceksepeti.com/",
          "https://www.sahibinden.com/",
          "https://www.pttavm.com/",
          "https://www.odamax.com/",
        ];

        const isRestricted = restrictedSites.some((site) =>
          siteURL.includes(site)
        );

        if (isRestricted) {
          console.log(`Access to the URL "${siteURL}" has been blocked.`);
          continue;
        }

        try {
          await page.goto(siteURL);
          const content = await page.content();
          const emailRegex =
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
          const pageEmails = content.match(emailRegex) || [];
          pageEmails.forEach(async (email) => {
            const strongEmailRegex =
              /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?![\w\W]*\.png$))/g;
            if (strongEmailRegex.test(email)) {
              const invalidExtensions = [
                ".png",
                ".webp",
                ".gif",
                ".jpg",
                "donanimhaber.com",
                ".svg",
                "etkialani.com",
                ".webp",
                ".gov.tr",
                "@example.com",
                "yandex-team.ru",
                "harita@destek.yandex.com.tr",
                "firmakuruyorum.com",
                "ikas.com",
                "email.com",
                "kuveytturk.com.tr",
                "memurlar.net",
                "sit.amet",
                "indeed.com",
                "schafer.com.tr",
                "domain...vb",
                "teknosa.com",
                "evkur.com.tr",
                "vestel.com.tr",
                "adres.net",
                "sabah.com.tr",
                "adres.com",
                "dha.com.tr",
                "deneme.com",
                "dha.com",
                "jpg.jpeg",
                "hurriyet.com.tr",
                "hurriyet.com",
                "ornek.com",
                "tatil.com",
                "evidea.com",
                "@getir.com",
                "domain.com",
                "eczacibasi.com.tr",
                "@hotmail.com",
                "ntv.com.tr",
                "jollytur.com",
                "info@iyilikkazansin.com",
                "test@web.com",
                "srvpanel.com",
                "wixpress.com",
                "getsentry.com",
                "test.com",
                "website.com",
                "kelebek.com",
                "site.com",
                "info@trendyol.com",
                "trendyol",
                "sentry.io",
                "musiad.org.tr",
                "musiad.at",
                "muesiad.dk",
                "visable.com",
                "roztocil.name",
                "bel.tr",
                ".kep.tr",
                "vip.163.com",
                "@donanimhaber.com",
                "mudo.com.tr",
                "otelfiyat.com",
                "dsdamat.com.tr",
                "armut.com",
                "homify.com",
                "yemeksepeti.com",
                "11.js",
                "flo.com.tr",
                "littlejoyturizm.com",
                "tatildenince.com",
                "tatilmaximum.com.tr",
                "tatilzon.com",
                "myratur.com",
                "amazon.com",
                "coex.cz",
                "nbxfx.com",
                ".edu.tr",
                "tse.org.tr",
                "eposta.com",
                "kiptas.com.tr",
                "verizon.net",
                ".yandex.ru",
                "addresshere.com",
                "siteadresi.com",
                "eleman.net",
                "emlakjet.com",
                "igairport.aero",
                "biletdukkani.com",
                "sochic.com",
                "atasay.com",
                "onedio.com",
                "altinbas.com",
                "steinfels-kg.de",
                "oggusto.com",
                "youremail.com",
                "boschelektriklielaletleri.com",
                "tatildukkani.com",
                "trthaber.com",
                "sokmarket.com.tr",
                "broofa.com",
                "opencart.com",
                "turhost.com",
                "wings.com.tr",
                "vanleeuwen.nl",
                "otelpuan.com",
                "email.here",
                "chp.org.tr",
                "eve.com.tr",
                "yenisafak.com",
                "iletisim@yenisafak.com.tr",
                "odtuteknokent.com.tr",
                "trabzonteknokent.com.tr",
                "milliyet.com.tr",
                "adresin.com",
                "otelpuan.com.tr",
                "siteniz.com",
                "joomla51.com",
                "odamax.com",
                "osb.org.tr",
                "adresiniz.com",
                "osb.com",
              ];
              const emailEndsWithInvalidExtension = invalidExtensions.some(
                (ext) => email.endsWith(ext)
              );
              if (!emailEndsWithInvalidExtension) {
                if (!findDuplicatedEmails(emailsSet, email)) {
                  emailsSet.add(email);
                  const emailFilePath = path.join(
                    __dirname,
                    `${sanitizedKeyword}.txt`
                  );
                  fs.appendFileSync(emailFilePath, email + "\n");

                  worksheet.addRow({ email: email });
                  rowCount++;

                  if (rowCount >= 300) {
                    await workbook.xlsx.writeFile(
                      path.join(
                        __dirname,
                        `${sanitizedKeyword}_emails_${excelFileCount}.xlsx`
                      )
                    );
                    excelFileCount++;
                    workbook = new ExcelJS.Workbook();
                    worksheet = workbook.addWorksheet("Emails");
                    worksheet.columns = [
                      { header: "Email", key: "email", width: 50 },
                    ];
                    rowCount = 0;
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error(`Error accessing the site: ${siteURL}`, error);
          continue;
        }
      }
      currentPage++;
    }

    if (rowCount > 0) {
      await workbook.xlsx.writeFile(
        path.join(
          __dirname,
          `${sanitizedKeyword}_emails_${excelFileCount}.xlsx`
        )
      );
    }

    const emails = [...emailsSet];
    return { emails, visitedSites };
  } catch (error) {
    throw error;
  } finally {
    await browser.close();
  }
}

async function scrapeEmailsForMultipleKeywords() {
  const keywords = readKeywords(keywordsFilePath);
  const searchedKeywords = readKeywords(searchedKeywordsFilePath);

  for (const keyword of keywords) {
    if (searchedKeywords.includes(keyword)) {
      console.log(
        `The keyword "${keyword}" has already been searched. Skipping...`
      );
      continue;
    }
    try {
      console.log(
        `Searching for email addresses for the keyword "${keyword}"...`
      );
      const { emails, visitedSites } = await scrapeEmailsFromGoogle(keyword);
      console.log(
        `Email addresses for the keyword "${keyword}" have been successfully retrieved.`
      );

      if (visitedSites.length === 0) {
        console.log(visitedSites, "empty");
        console.log(
          `No results found for "${keyword}". Moving on to the next keyword.`
        );
        continue;
      }

      saveKeyword(keyword, searchedKeywordsFilePath);
    } catch (error) {
      console.error(`An error occurred for the keyword "${keyword}":`, error);
    }
  }
}

scrapeEmailsForMultipleKeywords()
  .then(() => {
    console.log(
      "Email addresses for all keywords have been successfully retrieved."
    );
  })
  .catch((error) => {
    console.error("Error:", error);
  });
