import {dnsParser} from "./utils/parsers";

const MAX_TRY_COUNT = 3;
let tryCount = 1;

const URL = 'https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/';

const main = async () => {
  try {
    await dnsParser(URL);
  } catch (err: any) {
    tryCount++;
    console.log(`Error count ${tryCount}: `, err.message);
    if (tryCount <= MAX_TRY_COUNT) {
      await main();
    }
  }
}

main();
