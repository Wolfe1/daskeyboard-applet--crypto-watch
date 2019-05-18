const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;
var localStorage = require('localStorage')

const apiUrl = 'https://api.coinbase.com/v2/prices/';

async function getPrice(currency) {
  var data = await request.get({
    url: apiUrl + currency + '/spot',
    json: true
  });
  return data;
}

async function getDailyPrice(currency) {
  var dt = new Date();
  var pastUrl = apiUrl + currency + '/spot?date=' + dt.toJSON();
  logger.info("My url is: " + pastUrl);
  var data2 = await request.get({
    url: pastUrl,
    json: true
  });
  return data2.data.amount;
}

function round(number) {
  return number.toFixed(2);
}

function formatChange(number) {
  if (number >= 0) {
    return `+${round(number)}`;
  } else {
    return `${round(number)}`;
  }
}

function setLastPrice(price) {
  localStorage.setItem("lastPrice", price);
}

function getLastPrice(currency) {
  logger.info("local storage: " + localStorage.getItem("lastPrice"));
  if (localStorage.getItem("lastPrice") != null) {
    return localStorage.getItem("lastPrice");
  } else {
    // If no price is stored then return todays spot price
    return getDailyPrice(currency);
  }
}

class CryptoWatch extends q.DesktopApp {

  constructor() {
    super();
    logger.info("My refresh is: " + this.getRefreshInterval());
    this.pollingInterval = this.getRefreshInterval() * 60 * 1000;
    logger.info("My pollingInterval is: " + this.pollingInterval);
  }

  generateSignal(price, oldPrice) {
    const currency = this.config.currency;
    const isMuted = this.config.isMuted;
    const refresh = this.getRefreshInterval();
    const storedItem = localStorage.getItem("lastPrice");
    logger.info("price: " + price);
    // logger.info("oldprice: " + oldPrice);
    const latestPrice = price.data.amount * 1;
    const previousClose = oldPrice * 1;

    const change = formatChange((latestPrice - previousClose));
    const changePercent = formatChange(change / previousClose * 100);

    const color = (latestPrice >= previousClose) ? '#00FF00' : '#FF0000';
    
    return new q.Signal({
      points: [
        [new q.Point(color)]
      ],
      link: {
        url:  'www.coinbase.com',
        label: 'Show on Coinbase',
      },
      name: 'Current ' + currency +' Price',
      message:
        `${currency.substr(currency.length -3)} ${latestPrice} (${change} ${changePercent}%)` +
        `\nPrevious close: ${previousClose}` +
        `\nMy refresh is: ${refresh}` +
        `\nStored data: ${storedItem}`,
      isMuted: !isMuted  
    });
  }

  async run() {
    logger.info("Crypto Watch Running.");
    const currency = this.config.currency;
    const refresh = this.getRefreshInterval();
    logger.info("My refresh2 is: " + refresh);
    if (currency) {
      logger.info("My currency is: " + currency);
      var oldPrice = await getLastPrice(currency);
      var price = await getPrice(currency);
      setLastPrice(price.data.amount);
      logger.info("local storage 2: " + localStorage.getItem("lastPrice"));
      return this.generateSignal(price, oldPrice);
    } else {
      logger.info("No currency pair configured.");
      return null;
    }
  }

  async applyConfig() {
    const currency = this.config.currency;
    if (currency) {
      return getPrice(currency).then((response) => {
        return true;
      }).catch((error) => {
        throw new Error("Error validating currency pair: " + currency, error);
      })
    }
  }

  getRefreshInterval() {
		return this.config.refresh ? this.config.refresh : 15;
	}
}


module.exports = {
  formatChange: formatChange,
  getPrice: getPrice,
  getDailyPrice: getDailyPrice,
  CryptoWatch: CryptoWatch
}

const applet = new CryptoWatch();