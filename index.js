const NaverCrawler = require('./src/app');
const databaseLogger = require('./src/util').getLogger('Database');
const Cafe = require('./src/database');

//   // 0.11 단위로 10번 쪼개기
//   sLat: 126.5571948
//   eLat: 127.6544364
//   // 0.05 단위로 10번 쪼개기
//   sLng: 37.2551985
//   eLng: 37.7278507

const crawling = async () => {
  const params = {
    sLat: 127.2171948,
    eLat: 127.3271948,
    sLng: 37.4051985,
    eLng: 37.4551985,
  };
  const query = '카페';

  let x = 6;
  let y = 3;
  while (y !== 10) {
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

    params.sLat += 0.11;
    params.eLat += 0.11;
    x += 1;
    if (x === 10) {
      params.sLat -= 1.1;
      params.eLat -= 1.1;
      params.sLng += 0.05;
      params.eLng += 0.05;
      x = 0;
      y += 1;
    }
  }
};

crawling();
