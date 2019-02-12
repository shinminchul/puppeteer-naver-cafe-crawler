const NaverCrawler = require('./src/app');
const databaseLogger = require('./src/util').getLogger('Database');
const Cafe = require('./src/database');

//   // 0.11 단위로 10번 쪼개기
//   sLat: 126.5571948
//   eLat: 127.6544364
//   // 0.05 단위로 10번 쪼개기
//   sLng: 37.2551985
//   eLng: 37.7278507

const sLat = 126.5571948;
const eLat = 127.6544364;
const sLng = 37.2551985;
const eLng = 37.7278507;

const latDiff = eLat - sLat;
const lngDiff = eLng - sLng;

const latStep = latDiff / 20;
const lngStep = lngDiff / 20;

const crawling = async () => {
  const params = {
    sLat,
    eLat: sLat + latStep,
    sLng,
    eLng: sLng + lngStep,
  };
  const query = '카페';

  let x = 0;
  let y = 0;
  while (y !== 20) {
    databaseLogger.trace(`Crawl '${x + 1}' x '${y + 1}' region`);

    let index = 1;

    let results = [];
    while (results !== false) {
      databaseLogger.trace(`Start Crawling page '${index}'`);
      const crawler = new NaverCrawler(params, query);
      results = await crawler.crawlItemList(index);
      index += 1;
      if (results === false) break;
      try {
        for (const cafe of results) {
          const result = await Cafe.create(cafe);
          databaseLogger.debug(`Result of '${result.title}' : has successfully saved`);
        }
      } catch (error) {
        databaseLogger.error(`At page ${index} : ${error.message}`);
      }
    }

    params.sLat += latStep;
    params.eLat += latStep;
    x += 1;
    if (x === 20) {
      params.sLat -= latDiff;
      params.eLat -= latDiff;
      params.sLng += lngStep;
      params.eLng += lngStep;
      x = 0;
      y += 1;
    }
  }
};

crawling();
