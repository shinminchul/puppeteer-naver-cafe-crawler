const puppeteer = require('puppeteer');
const log4js = require('log4js');
const TARGET = '카페';

const logConfiguration = {
  appenders: {
    console: {
      type: 'stdout',
    },
    app: {
      type: 'file',
      filename: 'log/app.log',
      maxLogSize: 10485760,
      numBackups: 3,
    },
    errorFile: {
      type: 'file',
      filename: 'log/errors.log',
    },
    errors: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'errorFile',
    },
  },
  categories: {
    default: { appenders: ['app', 'errors', 'console'], level: 'TRACE' },
  },
};

log4js.configure(logConfiguration);
const puppeteerLogger = log4js.getLogger('PUPPETEER');
const listLogger = log4js.getLogger('LIST');
const itemLogger = log4js.getLogger('ITEM');

class naverCrawler {
  constructor(bounds, query) {
    this.baseURL = 'https://store.naver.com/restaurants/list';
    this.bounds = bounds;
    this.query = query;
  }

  makeQuery(params) {
    const esc = encodeURIComponent;
    return Object.keys(params)
      .map((k) => esc(k) + '=' + esc(params[k]))
      .join('&');
  }

  async crawlItemList(itemPage) {
    const { sLat, sLog, eLat, eLog } = this.bounds;
    const { crawlItemDetail } = this;

    const query = this.makeQuery({
      bounds: `${sLat};${sLog};${eLat};${eLog}`,
      page: itemPage || 1,
      query: '카페',
    });

    let browser;
    let page;

    try {
      browser = await puppeteer.launch();
      page = await browser.newPage();
      const url = `${this.baseURL}?${query}`;
      await page.goto(url);
    } catch (error) {
      puppeteerLogger.error(error.message);
      puppeteerLogger.error(`At Crawling : ${query}`);
      await browser.close();
      return;
    }

    let list;

    try {
      list = await page.$$eval('li.list_item.type_restaurant a.name', (list) =>
        list.map((el) => el.getAttribute('href')),
      );
    } catch (error) {
      listLogger.error(error.message);
      listLogger.error(`At Crawling : ${query}`);
      await browser.close();
      return;
    }

    const result = [];
    for (const link of list) {
      try {
        itemLogger.trace(`Crawl Detail : ${link}`);
        const detail = await crawlItemDetail(link);
        result.push(detail);
      } catch (error) {
        itemLogger.error(error.message);
        itemLogger.error(`At Crawling : ${link}`);
      }
    }

    console.log(result);

    await browser.close();
  }

  async crawlItemDetail(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${url}&tab=photo`);

    const cafe = {};

    try {
      cafe.title = await page.$eval(
        '.biz_name_area > .name',
        (title) => title.innerHTML,
      );
    } catch (error) {
      itemLogger.error(error.message);
      itemLogger.error(`At Crawling : ${url}`);
      await browser.close();
      return;
    }

    try {
      cafe.images = await page.$$eval(
        '.flick_content._page.eg-flick-panel > .thumb_area > div.thumb > img',
        (list) => list.map((el) => el.getAttribute('src')),
      );
    } catch (error) {
      console.error(error.message);
    }

    try {
      cafe.contact = await page.$eval(
        '.list_item.list_item_biztel > div.txt',
        (div) => div.innerHTML,
      );
    } catch (error) {
      console.error(error.message);
    }

    try {
      cafe.addresses = await page.$$eval(
        '.list_item.list_item_address > div.txt span.addr',
        (addrs) => addrs.map((addr) => addr.innerHTML),
      );
    } catch (error) {
      console.error(error.message);
    }

    try {
      cafe.openingHours = await page.$$eval(
        '.list_item.list_item_biztime .biztime',
        (biztimes) =>
          biztimes.map((biztime) => {
            const openingHour = {};
            openingHour.time = biztime.querySelector(
              '.time',
            ).firstChild.innerHTML;
            if (biztime.querySelector('.desc'))
              openingHour.description = biztime.querySelector(
                '.desc',
              ).firstChild.innerHTML;
            return openingHour;
          }),
      );
    } catch (error) {
      console.error(error.message);
    }

    try {
      const prices = await page.$$eval(
        '.list_item.list_item_menu .list_menu_inner .price',
        (list) => list.map((item) => item.innerHTML),
      );
      const menuNames = await page.$$eval(
        '.list_item.list_item_menu .list_menu_inner .name',
        (list) => list.map((item) => item.innerHTML),
      );
      cafe.menus = menuNames.map((name, index) => {
        return { name, price: prices[index] };
      });
    } catch (error) {
      console.error(error.message);
    }

    try {
      cafe.homepage = await page.$eval(
        '.list_item.list_item_homepage .biz_url',
        (url) => url.getAttribute('href'),
      );
    } catch (error) {
      console.error(error.message);
    }

    try {
      cafe.convenience = await page.$eval(
        '.list_item.list_item_convenience .convenience',
        (div) => div.innerHTML,
      );
    } catch (error) {
      console.error(error.message);
    }

    try {
      await page.click(
        '.list_item.list_item_desc > .txt > .ellipsis_area > a.btn_more',
      );
    } catch (error) {
      console.error(error.message);
    }

    try {
      cafe.description = await page.$eval(
        '.list_item.list_item_desc > .txt > .ellipsis_area > span',
        (desc) => desc.innerHTML,
      );
    } catch (error) {
      console.error(error.message);
    }

    await browser.close();
    return cafe;
  }
}

async function go() {
  const params = {
    sLat: 126.5571948,
    sLog: 37.2551985,
    eLat: 127.6544364,
    eLog: 37.7278507,
  };

  const crawler = new naverCrawler(params, TARGET );
  crawler.crawlItemList(250);
  // const item1 = await crawler.crawlItemDetail(
  //   'https://store.naver.com/restaurants/detail?id=773054532&query=%EC%95%84%EA%BC%AC%EB%96%BC%20%EB%92%A4%20%ED%8C%8C%EB%A5%B4%ED%81%AC',
  // );
  // console.log(item1);
}

go();
