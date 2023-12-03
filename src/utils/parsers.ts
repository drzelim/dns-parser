import cliProgress from "cli-progress";
import {Page} from "puppeteer";
import {IProduct} from "./types";
import {clearAllElements, innerClick, startBrowser, waitForTimeout, writeCSV} from "./utils";
import {blockResources} from "./block-resources";
import {TIMEOUT} from "./consts";

const getProducts = async (page: Page): Promise<IProduct[]> => {
  const resultArray = [];

  let products = await page.$$('[data-id="product"]');
  if (!products.length) products = await page.$$('.catalog-product');

  for (const product of products) {
    const nameElem = await product.$('.catalog-product__name span');
    const priceElem = await product.$('.product-buy__price');

    const name = await nameElem?.evaluate(node => node.textContent);
    const price = await priceElem?.evaluate(node => node.textContent);

    if (name && price) {
      resultArray.push({name, price: price.split('₽')[0].trim()});
    }
  }
  return resultArray;
}

export const dnsParser = async (url: string) => {
  const bar1 = new cliProgress.SingleBar({hideCursor: true}, cliProgress.Presets.shades_classic);


  const browser = await startBrowser();
  const page = await browser.newPage();
  await blockResources(page, browser);
  await waitForTimeout(1000);
  await page.goto(url, {waitUntil: 'networkidle2', timeout: TIMEOUT});

  await page.waitForSelector('.pagination-container', {timeout: 30000});
  await waitForTimeout(3000);

  let showMoreBtn = await page.$('.pagination-widget__show-more-btn')
    || await page.$('[data-role="show-more-btn"]');

  let nextPageLink = await page.$('.pagination-widget__page-link_next');
  const lastPageLink = await page.$('.pagination-widget__page-link_last');

  const MAX_PAGE_COUNT = +(await lastPageLink?.evaluate(node => {
    const href = (node as HTMLLinkElement).href;
    return (href?.split('?p=').at(-1));
  }) as string);

  let pageNumber = 0;
  let allProducts: IProduct[] = [];

  console.log('Total pages', MAX_PAGE_COUNT);
  bar1.start(MAX_PAGE_COUNT, pageNumber);

  while (showMoreBtn && nextPageLink) {
    const catalogProducts = await page.$$('.catalog-products');
    await clearAllElements(catalogProducts);
    await innerClick(nextPageLink);
    await page.waitForSelector('.product-buy__price', {timeout: 15000});
    await waitForTimeout(500);

    allProducts = [...allProducts, ...(await getProducts(page))];

    showMoreBtn = await page.$('.pagination-widget__show-more-btn')
      || await page.$('[data-role="show-more-btn"]');
    nextPageLink = await page.$('.pagination-widget__page-link_next');

    bar1.update(++pageNumber);
  }

  const firstPageLink = await page.$('[data-page-number="1"');
  if (firstPageLink) {
    const catalogProducts = await page.$$('.catalog-products');
    await clearAllElements(catalogProducts);
    await firstPageLink.evaluate((node) => {
      node.scrollIntoView({behavior: 'smooth'});
      return (node.firstElementChild as HTMLElement)?.click();
    });
    await page.waitForSelector('.product-buy__price', {timeout: 15000});
    await waitForTimeout(2000);
    allProducts = [...(await getProducts(page)), ...allProducts];
  }

  bar1.update(MAX_PAGE_COUNT);
  bar1.stop();

  await writeCSV(allProducts);

  console.log('============================================')
  console.log('Finish. Find', allProducts.length, 'products');
  console.log('The output file is located in the directory out/result.csv');

  await browser.close();
};
