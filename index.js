const NaverCrawler = require('./src/app');
const databaseLogger = require('./src/util').getLogger('Database');
const Cafe = require('./src/database');

const crawling = async () => {
  const params = {
    sLat: 126.5571948,
    sLng: 37.2551985,
    eLat: 127.6544364,
    eLng: 37.7278507,
  };
  const query = '카페';
  let index = 24;
  let results = [];

  while (results !== false) {
    databaseLogger.trace(`Start Crawling page '${index}'`);
    const crawler = new NaverCrawler(params, query);
    results = await crawler.crawlItemList(index);
    index += 1;

    for (const cafe of results) {
      try {
        const result = await Cafe.create(cafe);
        databaseLogger.debug(`Result of '${result.title}' : has successfully saved`);
      } catch (error) {
        databaseLogger.error(`At page ${index} : ${error.message}`);
      }
    }
  }
};

crawling();
