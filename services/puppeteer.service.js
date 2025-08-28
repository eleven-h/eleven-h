const puppeteer = require('puppeteer');
class PuppeteerService {
  browser;
  page;

  async init() {
    const proxyArg = process.env.HTTP_PROXY ? `--proxy-server=${process.env.HTTP_PROXY}` : null;
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--incognito',
    ];
    if (proxyArg) args.push(proxyArg);

    this.browser = await puppeteer.launch({
      args,
      // headless: false,
    });
  }

  /**
   *
   * @param {string} url
   */
  async goToPage(url) {
    if (!this.browser) {
      await this.init();
    }
    this.page = await this.browser.newPage();

    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US',
    });

    await this.page.goto(url, {
      waitUntil: `networkidle0`,
    });
  }

  async close() {
    await this.page.close();
    await this.browser.close();
  }

  /**
   *
   * @param {string} acc Account to crawl
   * @param {number} n Qty of image to fetch
   */
  async getLatestInstagramPostsFromAccount(acc, n) {
    try {
      const page = `https://www.picuki.com/profile/${acc}`;
      await this.goToPage(page);
      let previousHeight;

      previousHeight = await this.page.evaluate(`document.body.scrollHeight`);
      await this.page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
      // 🔽 Doesn't seem to be needed
      // await this.page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await this.page.waitForTimeout(1000);

      const nodes = await this.page.evaluate(() => {
        const images = document.querySelectorAll(`.post-image`);
        return [].map.call(images, img => img.src);
      });

      console.log('nodes', nodes);

      return nodes.slice(0, 3);
    } catch (error) {
      console.log('Error', error);
      return [];
    }
  }
}

const puppeteerService = new PuppeteerService();

module.exports = puppeteerService;
