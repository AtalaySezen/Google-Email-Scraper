const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const Table = require("cli-table3");
const ExcelJS = require("exceljs");
const figlet = require("figlet");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const ora = require("ora");
const keywordsFilePath = "keywords.txt";
const searchedKeywordsFilePath = "searched_keywords.txt";

const randomDelay = (min, max) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)),
  );

function showHeader() {
  console.clear();
  console.log(
    chalk.green(
      figlet.textSync("Google Email Scraper V2", {
        horizontalLayout: "full",
      }),
    ),
  );
  console.log(
    chalk.yellow(
      "                                     Created by Atalay Sezen",
    ),
  );
  console.log(
    chalk.red(
      "  42 65 74 74 65 72 20 57 65 62 3F 20 57 6F 72 6B 69 6E 67 20 6F 6E 20 69 74 2E\n",
    ),
  );
  console.log(chalk.green("  ----Albis\n"));
  console.log(
    chalk.yellow("  Auto Google Scraper | Stealth Mode | Excel Export\n"),
  );
  console.log(
    chalk.cyan("  --------------------------------------------------\n"),
  );
}

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

async function extractAndAddEmails(page, emailsSet, worksheet, spinner) {
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
        ".gov.tr",
        "@example.com",
        "yandex-team.ru",
        "google.com",
        "wix.com",
        "wordpress.com",
        "bootstrap",
        "react",
        "jquery",
        "trendyol",
        "hepsiburada",
        "sahibinden",
      ];
      const emailEndsWithInvalidExtension = invalidExtensions.some(
        (ext) => email.endsWith(ext) || email.includes(ext),
      );
      if (!emailEndsWithInvalidExtension) {
        if (!findDuplicatedEmails(emailsSet, email)) {
          emailsSet.add(email);
          spinner.stopAndPersist({
            symbol: chalk.green("✔"),
            text: chalk.green(` ${email}`),
          });
          spinner.start();

          worksheet.addRow({ email: email });
          foundCount++;
        }
      }
    }
  }
  return foundCount;
}

async function scrapeEmailsFromGoogle(keyword, mainSpinner) {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./chrome_profile",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1200,800",
    ],
    defaultViewport: null,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  mainSpinner.text = `${chalk.bold(keyword)}: Tarayıcı başlatılıyor...`;
  let workbook = new ExcelJS.Workbook();
  let worksheet = workbook.addWorksheet("Emails");
  worksheet.columns = [{ header: "Email", key: "email", width: 50 }];
  const sanitizedKeyword = sanitizeFilename(keyword);
  const excelFileName = `${sanitizedKeyword}.xlsx`;
  const excelFilePath = path.join(__dirname, excelFileName);
  try {
    let emailsSet = new Set();
    let currentPage = 1;
    let noMoreResults = false;
    let totalEmailsFound = 0;

    while (!noMoreResults) {
      mainSpinner.text = `${chalk.bold(keyword)}: Google Sayfa ${currentPage} taranıyor...`;
      await page.goto(
        `https://www.google.com/search?q=${keyword}&start=${(currentPage - 1) * 10}`,
        { waitUntil: "domcontentloaded" },
      );

      if (await isBlocked(page)) {
        mainSpinner.warn(
          chalk.red("CAPTCHA Algılandı! Lütfen 60sn içinde çözün..."),
        );
        await randomDelay(60000, 60000);
        if (await isBlocked(page)) {
          mainSpinner.fail(chalk.red("Blok aşılamadı, bu kelime atlanıyor."));
          break;
        }
        mainSpinner.start("CAPTCHA çözüldü, devam ediliyor...");
      }

      await randomDelay(2000, 3000);

      const siteURLs = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("div#search a"));
        return anchors
          .map((a) => a.href)
          .filter(
            (href) =>
              href && href.startsWith("http") && !href.includes("google.com"),
          );
      });

      const uniqueURLs = [...new Set(siteURLs)];

      if (uniqueURLs.length === 0) {
        const nextButton = await page.$("#pnnext");
        if (!nextButton) {
          noMoreResults = true;
        }
      }

      for (const siteURL of uniqueURLs) {
        const restrictedSites = [
          "trendyol.com",
          "hepsiburada.com",
          "n11.com",
          "facebook.com",
          "instagram.com",
          "linkedin.com",
          "youtube.com",
        ];
        if (restrictedSites.some((site) => siteURL.includes(site))) continue;

        try {
          mainSpinner.text = `${chalk.blue("Ziyaret Ediliyor:")} ${siteURL.substring(0, 50)}...`;

          await page
            .goto(siteURL, { waitUntil: "domcontentloaded", timeout: 12000 })
            .catch(() => {});
          await randomDelay(500, 1000);

          let found = await extractAndAddEmails(
            page,
            emailsSet,
            worksheet,
            mainSpinner,
          );
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
              mainSpinner.text = `${chalk.magenta("İletişim Sayfası:")} ${contactLink.substring(0, 50)}...`;
              await page
                .goto(contactLink, {
                  waitUntil: "domcontentloaded",
                  timeout: 12000,
                })
                .catch(() => {});
              await randomDelay(500, 1000);
              found += await extractAndAddEmails(
                page,
                emailsSet,
                worksheet,
                mainSpinner,
              );
            }
          }

          if (found > 0) {
            totalEmailsFound += found;
            await workbook.xlsx.writeFile(excelFilePath);
          }
        } catch (error) {
          continue;
        }
      }
      currentPage++;
      if (currentPage > 5) noMoreResults = true;
    }
    return { count: totalEmailsFound };
  } catch (error) {
    throw error;
  } finally {
    await browser.close();
  }
}

async function scrapeEmailsForMultipleKeywords() {
  showHeader();
  const keywords = readKeywords(keywordsFilePath);
  const searchedKeywords = readKeywords(searchedKeywordsFilePath);
  const summaryTable = new Table({
    head: [
      chalk.cyan("Anahtar Kelime"),
      chalk.cyan("Email"),
      chalk.cyan("Durum"),
    ],
    colWidths: [40, 10, 20],
  });
  for (const keyword of keywords) {
    if (searchedKeywords.includes(keyword)) {
      console.log(chalk.gray(`Skipping: ${keyword} (Zaten taranmış)`));
      continue;
    }
    const spinner = ora(`${chalk.bold(keyword)} başlatılıyor...`).start();
    try {
      const { count } = await scrapeEmailsFromGoogle(keyword, spinner);
      spinner.succeed(chalk.green(`Tamamlandı: ${keyword}`));
      console.log(chalk.bgGreen.black(` TOPLAM SONUÇ: ${count} email `) + "\n");
      summaryTable.push([
        keyword,
        chalk.green(count),
        chalk.green("Tamamlandı"),
      ]);

      saveKeyword(keyword, searchedKeywordsFilePath);
      spinner.start(chalk.yellow("Google ban yememek için bekleniyor..."));
      await randomDelay(3000, 5000);
      spinner.stop();
    } catch (error) {
      spinner.fail(chalk.red(`Hata oluştu: ${keyword}`));
      console.error(error);
      summaryTable.push([keyword, chalk.red("0"), chalk.red("Hata")]);
    }
  }
  console.log("\n" + chalk.bold.yellow("📊 İŞLEM ÖZETİ:"));
  console.log(summaryTable.toString());
  console.log(chalk.blue.bold("\n--- TÜM İŞLEMLER BİTTİ ---"));
  process.stdout.write("\x07");
}

scrapeEmailsForMultipleKeywords();
