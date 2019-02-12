const puppeteer = require('puppeteer');
const { makeQuery, getLogger } = require('./util');
const { getLatLng } = require('./service');

const puppeteerLogger = getLogger('PUPPETEER');
const listLogger = getLogger('LIST');
const itemLogger = getLogger('ITEM');

module.exports = class NaverCrawler {
  constructor(bounds, query) {
    this.baseURL = 'https://store.naver.com/restaurants/list';
    this.bounds = bounds;
    this.query = query;
  }

  async crawlItemList(itemPage) {
    const {
      sLat, sLng, eLat, eLng,
    } = this.bounds;
    const { crawlItemDetail } = this;

    const query = makeQuery({
      bounds: `${sLat};${sLng};${eLat};${eLng}`,
      page: itemPage || 1,
      query: this.query,
    });

    let browser;
    let page;
    try {
      browser = await puppeteer.launch();
      page = await browser.newPage();
      const url = `${this.baseURL}?${query}`;
      listLogger.trace(`Start crawling url : ${url}`);
      await page.goto(url);
    } catch (error) {
      puppeteerLogger.error(error.message);
      puppeteerLogger.error(`At Crawling : ${query}`);
      await browser.close();
      return [];
    }

    let linkList;
    try {
      await page.waitForSelector('li.list_item.type_restaurant a.name', { timeout: 3000 });
      linkList = await page.$$eval('li.list_item.type_restaurant a.name', links => links.map(link => link.getAttribute('href')));
    } catch (error) {
      listLogger.error(`No list at : ${sLat} - ${sLng} - ${eLat} - ${eLng} at page ${itemPage}`);
      await browser.close();
      return [];
    }

    const results = [];
    if (linkList) {
      for (const link of linkList) {
        try {
          results.push(await crawlItemDetail(link));
        } catch (error) {
          itemLogger.error(error.message);
          itemLogger.error(`At Crawling : ${itemPage}`);
        }
      }
    }

    await browser.close();
    return results;
  }

  async crawlItemDetail(url) {
    itemLogger.trace(`Crawl Detail : ${url}`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${url}&tab=photo`);

    const cafe = {};
    const waitOption = { timeout: 3500 };
    // await page.waitFor(1500);

    try {
      const titleSelector = '.biz_name_area > .name';
      await page.waitForSelector(titleSelector, waitOption);
      cafe.title = await page.$eval(titleSelector, title => title.innerHTML);
    } catch (error) {
      itemLogger.error(error.message);
      itemLogger.error(`At Crawling : ${url}`);
      await browser.close();
      return;
    }

    try {
      const addressesSelector = '.list_item.list_item_address > div.txt span.addr';
      await page.waitForSelector(addressesSelector, waitOption);
      const addresses = await page.$$eval(addressesSelector, addrs => addrs.map(addr => addr.innerHTML));
      cafe.addresses = addresses;
      cafe.location = await getLatLng(addresses[0]);
    } catch (error) {
      console.error(error.message);
    }

    try {
      const imagesSelector = '.flick_content._page.eg-flick-panel > .thumb_area > div.thumb > img';
      // await page.waitForSelector(imagesSelector, waitOption);
      cafe.images = await page.$$eval(imagesSelector, list => list.map(el => el.getAttribute('src')));
    } catch (error) {
      console.error(error.message);
    }

    try {
      const contactSelector = '.list_item.list_item_biztel > div.txt';
      // await page.waitForSelector(contactSelector, waitOption);
      cafe.contact = await page.$eval(contactSelector, div => div.innerHTML);
    } catch (error) {
      console.error(error.message);
    }

    try {
      const openingHoursSelector = '.list_item.list_item_biztime .biztime';
      // await page.waitForSelector(openingHoursSelector, waitOption);
      cafe.openingHours = await page.$$eval(openingHoursSelector, biztimes => biztimes.map((biztime) => {
        const openingHour = {};
        openingHour.time = biztime.querySelector('.time').firstChild.innerHTML;
        if (biztime.querySelector('.desc')) {
          openingHour.description = biztime.querySelector('.desc').firstChild.innerHTML;
        }
        return openingHour;
      }));
    } catch (error) {
      console.error(error.message);
    }

    try {
      const pricesSelector = '.list_item.list_item_menu .list_menu_inner .price';
      const menuNamesSelector = '.list_item.list_item_menu .list_menu_inner .name';
      // await page.waitForSelector(pricesSelector, waitOption);
      // await page.waitForSelector(menuNamesSelector, waitOption);
      const prices = await page.$$eval(pricesSelector, list => list.map(item => item.innerHTML));
      const menuNames = await page.$$eval(menuNamesSelector, list => list.map(item => item.innerHTML));
      cafe.menus = menuNames.map((name, index) => ({ name, price: prices[index] }));
    } catch (error) {
      console.error(error.message);
    }

    try {
      const homepageSelector = '.list_item.list_item_homepage .biz_url';
      // await page.waitForSelector(homepageSelector, waitOption);
      cafe.homepage = await page.$eval(homepageSelector, a => a.getAttribute('href'));
    } catch (error) {
      console.error(error.message);
    }

    try {
      const convenienceSelector = '.list_item.list_item_convenience .convenience';
      // await page.waitForSelector(convenienceSelector, waitOption);
      cafe.convenience = await page.$eval(convenienceSelector, div => div.innerHTML);
    } catch (error) {
      console.error(error.message);
    }

    try {
      const buttonSelector = '.list_item.list_item_desc > .txt > .ellipsis_area > a.btn_more';
      // await page.waitForSelector(buttonSelector, waitOption);
      await page.click(buttonSelector);
    } catch (error) {
      console.error(error.message);
    }

    try {
      const descriptionSelector = '.list_item.list_item_desc > .txt > .ellipsis_area > span';
      // await page.waitForSelector(descriptionSelector, waitOption);
      cafe.description = await page.$eval(descriptionSelector, desc => desc.innerHTML);
    } catch (error) {
      console.error(error.message);
    }

    await browser.close();
    return cafe;
  }
};
