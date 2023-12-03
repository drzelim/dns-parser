import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {Browser, ElementHandle, executablePath} from 'puppeteer';
import {TIMEOUT, userAgent} from "./consts";
import {createObjectCsvWriter as createCsvWriter} from "csv-writer";
import {IProduct} from "./types";

const pluginStealth = StealthPlugin();
puppeteer.use(pluginStealth);

export const startBrowser = async (): Promise<Browser> => {
  return await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080 - 111,
      deviceScaleFactor: 1
    },
    executablePath: executablePath(),
    ignoreDefaultArgs: [
      "--enable-automation"
    ],
    args: [
      `--user-agent=${userAgent}`,
      '--no-default-browser-check',
    ],
    timeout: TIMEOUT,
  });
}

export const waitForTimeout = async (timeout: number) => new Promise(r => setTimeout(r, timeout));

export const clearAllElements = async (containers: ElementHandle[]) => {
  await Promise.all(containers.map(container => container.evaluate(node => node.innerHTML = '')));
}

export const innerClick = async (element: ElementHandle) => {
  await element.evaluate((node) => {
    node.scrollIntoView({behavior: 'smooth'});
    (node as HTMLElement)?.click();
  });
};


export const writeCSV = async (allProducts: IProduct[]) => {
  const csvWriter = createCsvWriter({
    path: './out/result.csv',
    header: [
      {id: 'name', title: 'Наименование'},
      {id: 'price', title: 'Цена'}
    ],
  });

  await csvWriter.writeRecords(allProducts);
}
