const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const keywordsFilePath = "keywords.txt";
const searchedKeywordsFilePath = "searched_keywords.txt";

const randomDelay = (min, max) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)),
  );

async function isBlocked(page) {
  const url = page.url();
  if (
    url.toLowerCase().includes("sorry") ||
    (await page.$('iframe[src*="recaptcha"]'))
  ) {
    return true;
  }
  return false;
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
  fs.appendFileSync(filePath, keyword.trim() + "\n");
}

function sanitizeFilename(name) {
  let cleanName = name
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c");
  cleanName = cleanName.replace(/\s+/g, "_");
  cleanName = cleanName.replace(/[^a-zA-Z0-9_]/g, "");
  return cleanName.toLowerCase();
}

async function extractAndAddEmails(page, emailsSet, worksheet) {
  const content = await page.content();
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const pageEmails = content.match(emailRegex) || [];
  let foundCount = 0;

  for (const email of pageEmails) {
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
        "wix.com",
        "wordpress.com",
        "bootstrap",
        "react",
        "jquery",
        "google.com",
      ];

      const emailEndsWithInvalidExtension = invalidExtensions.some(
        (ext) => email.endsWith(ext) || email.includes(ext),
      );

      if (!emailEndsWithInvalidExtension) {
        if (!findDuplicatedEmails(emailsSet, email)) {
          emailsSet.add(email);
          console.log(`[EKLENDİ] ${email}`);
          worksheet.addRow({ email: email });
          foundCount++;
        }
      }
    }
  }
  return foundCount;
}

async function scrapeEmailsFromGoogle(keyword) {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./chrome_profile",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  );
  let workbook = new ExcelJS.Workbook();
  let worksheet = workbook.addWorksheet("Emails");
  worksheet.columns = [{ header: "Email", key: "email", width: 50 }];
  const sanitizedKeyword = sanitizeFilename(keyword);
  const excelFileName = `${sanitizedKeyword}.xlsx`;
  const excelFilePath = path.join(__dirname, excelFileName);

  try {
    let emailsSet = new Set();
    let visitedSites = [];
    let currentPage = 1;
    let noMoreResults = false;

    while (!noMoreResults) {
      console.log(`--- Sayfa ${currentPage} Taranıyor ---`);

      await page.goto(
        `https://www.google.com/search?q=${keyword}&start=${(currentPage - 1) * 10}`,
        { waitUntil: "domcontentloaded" },
      );

      if (await isBlocked(page)) {
        console.log("!!! CAPTCHA BEKLENİYOR (60sn) !!!");
        await randomDelay(60000, 60000);
        if (await isBlocked(page)) {
          console.log("Blok devam ediyor, çıkılıyor.");
          break;
        }
      }

      await randomDelay(2000, 3000);

      const siteURLs = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("div#search a"));
        return anchors
          .map((a) => a.href)
          .filter(
            (href) =>
              href &&
              href.startsWith("http") &&
              !href.includes("google.com") &&
              !href.includes("googleusercontent"),
          );
      });

      const uniqueURLs = [...new Set(siteURLs)];
      console.log(`Link Count: ${uniqueURLs.length}`);
      if (uniqueURLs.length === 0) {
        const nextButton = await page.$("#pnnext");
        if (!nextButton) {
          console.log("Done");
          noMoreResults = true;
        }
      }
      visitedSites.push(...uniqueURLs);
      for (const siteURL of uniqueURLs) {
        const restrictedSites = [
          "trendyol.com",
          "hepsiburada.com",
          "n11.com",
          "amazon.com",
          "sahibinden.com",
          "facebook.com",
          "twitter.com",
          "instagram.com",
          "linkedin.com",
          "youtube.com",
          "pinterest.com",
          "wikipedia.org",
          "tripadvisor.com",
          "sikayetvar.com",
        ];
        if (restrictedSites.some((site) => siteURL.includes(site))) continue;
        try {
          console.log(`Visit: ${siteURL}`);
          await page
            .goto(siteURL, { waitUntil: "domcontentloaded", timeout: 15000 })
            .catch(() => {});
          await randomDelay(1000, 1500);
          let found = await extractAndAddEmails(page, emailsSet, worksheet);
          if (found === 0) {
            const contactLink = await page.evaluate(() => {
              const links = Array.from(document.querySelectorAll("a"));
              const contactRegex = /iletişim|contact|bize ulaşın/i;
              const link = links.find(
                (a) =>
                  contactRegex.test(a.innerText) || contactRegex.test(a.href),
              );
              return link ? link.href : null;
            });

            if (contactLink) {
              console.log(`   -> Contact: ${contactLink}`);
              await page
                .goto(contactLink, {
                  waitUntil: "domcontentloaded",
                  timeout: 15000,
                })
                .catch(() => {});
              await randomDelay(1000, 1500);
              found += await extractAndAddEmails(page, emailsSet, worksheet);
            }
          }

          if (found > 0) {
            await workbook.xlsx.writeFile(excelFilePath);
            console.log(` ${found}.${excelFileName}`);
          }
        } catch (error) {
          continue;
        }
      }
      currentPage++;
      if (currentPage > 5) noMoreResults = true;
    }

    return { emails: [...emailsSet] };
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
      console.log(`"${keyword}" atlanıyor.`);
      continue;
    }
    try {
      console.log(`\n=== "${keyword}" BAŞLIYOR ===\n`);
      const { emails } = await scrapeEmailsFromGoogle(keyword);
      console.log(
        `\n=== BİTTİ: "${keyword}" için toplam ${emails.length} email bulundu ===\n`,
      );

      saveKeyword(keyword, searchedKeywordsFilePath);
      await randomDelay(3000, 5000);
    } catch (error) {
      console.error(`Hata:`, error);
    }
  }
}
scrapeEmailsForMultipleKeywords();
