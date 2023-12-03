import {Browser, HTTPRequest, Page, Target} from "puppeteer";

const blockTrackersChecker = (request: HTTPRequest): boolean => {
  const requestUrl = request.url();
  let url = requestUrl.split('/')[2];
  if (url) url = url.replace('www.', '');

  const abortUrls = new Set([
    'mc.yandex.ru', 'yabs.yandex.ru',
    'google-analytics.com', 'googletagmanager.com',
    'tracker.comagic.ru', 'app.comagic.ru',
    'top-fwz1.mail.ru', 'app.uiscom.ru', 'cllctr.roistat.com',
    'cloud.roistat.com', 'cdn.retailrocket.ru', 'analytics.dns-shop.ru'
  ]);

  const blockedUrls = [
    'yandex.ru/clck/counter', 'yandex.ru/clck/click',
    'botfaqtor.ru', "yandex-metrica-watch",
    "tag.js", "google"
  ];

  return abortUrls.has(url) || blockedUrls.some(elem => requestUrl.includes(elem));
};

const blockImagesChecker = (request: HTTPRequest): boolean => {
  return request.resourceType() === 'image';
};

const blockStylesChecker = (request: HTTPRequest): boolean => {
  return request.resourceType() === 'stylesheet';
};

const setBlockResourcesHandler = async (page: Page) => {
  await page.setRequestInterception(true);
  await page.setBypassServiceWorker(true);

  page.on('request', (request) => {
    const isRequestBlock = blockImagesChecker(request)
                           || blockStylesChecker(request)
                           || blockTrackersChecker(request);

    if (isRequestBlock) {
      request.abort();
    } else {
      request.continue();
    }
  });
};


export const blockResources = async (page: Page, browser: Browser) => {
  await setBlockResourcesHandler(page);

  browser.on('targetcreated', async (target: Target): Promise<void> => {
    const page = await target.page();
    if (!page) return;
    try {
      await setBlockResourcesHandler(page);
    } catch (err) {
    }
  });
};
