require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const puppeteerService = require('./services/puppeteer.service');

const MUSTACHE_MAIN_DIR = './main.mustache';

const CITY_NAME = process.env.CITY_NAME || 'Zhengzhou,CN';
const TIMEZONE = process.env.TIMEZONE || 'Asia/Shanghai';

let DATA = {
  refresh_date: new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: TIMEZONE,
  }),
};

async function setWeatherInformation() {
  try {
    await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(CITY_NAME)}&appid=${process.env.OPEN_WEATHER_MAP_KEY}&units=metric`
    )
      .then(r => r.json())
      .then(r => {
        if (!r || !r.main || !r.weather || !r.weather[0] || !r.sys) {
          throw new Error('Invalid weather payload');
        }
        DATA.city_temperature = Math.round(r.main.temp);
        DATA.city_weather = r.weather[0].description;
        DATA.city_weather_icon = r.weather[0].icon;
        DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: TIMEZONE,
        });
        DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: TIMEZONE,
        });
      });
  } catch (err) {
    DATA.city_temperature = '--';
    DATA.city_weather = 'unavailable';
    DATA.city_weather_icon = '';
    DATA.sun_rise = '--:--';
    DATA.sun_set = '--:--';
  }
}

async function setInstagramPosts() {
  try {
    const instagramAccount = process.env.INSTAGRAM_ACCOUNT || 'visitstockholm';
    const instagramImages = await puppeteerService.getLatestInstagramPostsFromAccount(instagramAccount, 3);
    DATA.img1 = (instagramImages && instagramImages[0]) || '';
    DATA.img2 = (instagramImages && instagramImages[1]) || '';
    DATA.img3 = (instagramImages && instagramImages[2]) || '';
  } catch (e) {
    DATA.img1 = '';
    DATA.img2 = '';
    DATA.img3 = '';
  }
}

async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
  /**
   * Fetch Weather
   */
  await setWeatherInformation();

  /**
   * Get pictures
   */
  await setInstagramPosts();

  /**
   * Generate README
   */
  await generateReadMe();

  /**
   * Fermeture de la boutique 👋
   */
  await puppeteerService.close();
}

action();
