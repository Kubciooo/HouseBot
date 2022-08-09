const puppeteer = require("puppeteer");
const clear = require("console-clear");
const fs = require("fs");

const Pages = {
  Otodom: "Otodom",
  OlxOchota: "Olx Ochota",
  OlxSrodmiescie: "Olx Śródmieście",
  OlxWola: "Olx Wola",
  Morizon: "Morizon",
};

const PagesSettings = {
  [Pages.Otodom]: {
    url: "https://www.otodom.pl/pl/oferty/wynajem/mieszkanie/wiele-lokalizacji?distanceRadius=0&page=1&limit=36&market=ALL&priceMin=3000&priceMax=6000&locations=%5Bdistricts_6-39%2Cdistricts_6-40%2Cdistricts_6-44%2Cdistricts_6-117%2Cdistricts_6-3319%5D&areaMin=50&viewType=listing",
    selector: 'a[data-cy="listing-item-link"]',
    slices: 3,
  },
  [Pages.Morizon]: {
    url: "https://www.morizon.pl/do-wynajecia/mieszkania/najnowsze/warszawa/?ps%5Bprice_from%5D=3000&ps%5Bprice_to%5D=6000&ps%5Bprice_m2_from%5D=50&ps%5Bdict_building_type%5D=244%2C245%2C246",
    selector: ".property-url",
    slices: 1,
  },
  [Pages.OlxOchota]: {
    url: "https://www.olx.pl/d/nieruchomosci/mieszkania/wynajem/warszawa/?search%5Bdistrict_id%5D=355&search%5Border%5D=created_at:desc&search%5Bfilter_float_price:from%5D=3000&search%5Bfilter_float_price:to%5D=6000&search%5Bfilter_enum_builttype%5D%5B0%5D=apartamentowiec&search%5Bfilter_enum_builttype%5D%5B1%5D=blok&search%5Bfilter_enum_builttype%5D%5B2%5D=szeregowiec&search%5Bfilter_enum_builttype%5D%5B3%5D=wolnostojacy&search%5Bfilter_float_m:from%5D=50&search%5Bfilter_enum_rooms%5D%5B0%5D=four&search%5Bfilter_enum_rooms%5D%5B1%5D=three",
    selector: 'div[data-cy="l-card"] > a',
    slices: 0,
  },
  [Pages.OlxWola]: {
    url: "https://www.olx.pl/d/nieruchomosci/mieszkania/wynajem/warszawa/?search%5Bdistrict_id%5D=359&search%5Border%5D=created_at:desc&search%5Bfilter_float_price:from%5D=3000&search%5Bfilter_float_price:to%5D=6000&search%5Bfilter_enum_builttype%5D%5B0%5D=apartamentowiec&search%5Bfilter_enum_builttype%5D%5B1%5D=blok&search%5Bfilter_enum_builttype%5D%5B2%5D=szeregowiec&search%5Bfilter_enum_builttype%5D%5B3%5D=wolnostojacy&search%5Bfilter_float_m:from%5D=50&search%5Bfilter_enum_rooms%5D%5B0%5D=four&search%5Bfilter_enum_rooms%5D%5B1%5D=three",
    selector: 'div[data-cy="l-card"] > a',
    slices: 0,
  },
  [Pages.OlxSrodmiescie]: {
    url: "https://www.olx.pl/d/nieruchomosci/mieszkania/wynajem/warszawa/?search%5Bdistrict_id%5D=351&search%5Border%5D=created_at:desc&search%5Bfilter_float_price:from%5D=3000&search%5Bfilter_float_price:to%5D=6000&search%5Bfilter_enum_builttype%5D%5B0%5D=apartamentowiec&search%5Bfilter_enum_builttype%5D%5B1%5D=blok&search%5Bfilter_enum_builttype%5D%5B2%5D=szeregowiec&search%5Bfilter_enum_builttype%5D%5B3%5D=wolnostojacy&search%5Bfilter_float_m:from%5D=50&search%5Bfilter_enum_rooms%5D%5B0%5D=four&search%5Bfilter_enum_rooms%5D%5B1%5D=three",
    selector: 'div[data-cy="l-card"] > a',
    slices: 0,
  },
};

const getOffersFromJson = async () => {
  const offers = await JSON.parse(await fs.promises.readFile("./offers.json"));
  return offers;
};

const getSessionOffersFromJson = async () => {
  const offers = await JSON.parse(
    await fs.promises.readFile("./sessionOffers.json")
  );
  return offers;
};

const pushSessionOffersToJson = async (newOffers) => {
  const offers = await getSessionOffersFromJson();
  offers.push(...newOffers);
  await fs.promises.writeFile("./sessionOffers.json", JSON.stringify(offers));
};

const clearSessionOffers = async () => {
  await fs.promises.writeFile("./sessionOffers.json", JSON.stringify([]));
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const notifyUser = async (offers) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  for (const offer of offers) {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    console.log(`Notifying user about offer: ${offer}`);
    await page.goto(offer);
  }

  while (true) {
    if ((await browser.pages()).length === 0) {
      return;
    }

    await sleep(1000);
  }
};

const updateJsonOffers = async (newOffers) => {
  await fs.promises.writeFile("./offers.json", JSON.stringify(newOffers));
};

const checkIfOfferAlreadyExistsInJson = (offer, jsonOffers) => {
  return jsonOffers.some((jsonOffer) => jsonOffer === offer);
};

const checkPageOffers = async (browser, settings) => {
  const page = await browser.newPage();

  await page.goto(settings.url);
  const offers = await page.evaluate((settings) => {
    const offerLinks = document.querySelectorAll(settings.selector);

    return Array.from(offerLinks)
      .map((link) => link.href)
      .slice(settings.slices, -1);
  }, settings);

  await page.close();
  return offers;
};

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  await clearSessionOffers();

  const jsonOffers = await getOffersFromJson();
  const newOffers = [];
  let offersSinceSessionStart = 0;

  while (true) {
    clear();
    console.log(`Offers since session start: ${offersSinceSessionStart}`);
    console.log(
      `Checking offers: ${new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "full",
        timeStyle: "long",
      }).format(Date.now())}`
    );

    for (const page in PagesSettings) {
      const offers = await checkPageOffers(browser, PagesSettings[page]);
      console.log(`Found ${offers.length} offers on ${page}`);

      for (const offer of offers) {
        if (!checkIfOfferAlreadyExistsInJson(offer, jsonOffers) && !checkIfOfferAlreadyExistsInJson(offer, newOffers)) {
          newOffers.push(offer);
        }
      }
    }

    console.log(`Found ${newOffers.length} new offers`);
    await pushSessionOffersToJson(newOffers);

    offersSinceSessionStart += newOffers.length;

    if (newOffers.length > 0) {
      jsonOffers.push(...newOffers);
      await notifyUser([...newOffers]);
      await updateJsonOffers(jsonOffers);
      newOffers.splice(0, newOffers.length);
    }

    await sleep(60000);
  }
})();
