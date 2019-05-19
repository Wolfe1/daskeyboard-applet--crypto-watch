const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;
const localStorage = require('localStorage')

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
  var data = await request.get({
    url: pastUrl,
    json: true
  });
  return data.data.amount;
}

function round(number, decimals) {
  return number.toFixed(decimals);
}

function formatChange(number, decimals) {
  if (number >= 0) {
    return `+${round(number, decimals)}`;
  } else {
    return `${round(number, decimals)}`;
  }
}

//Store price obtained from last update
function setLastPrice(price) {
  localStorage.setItem("lastPrice", price);
}

//Retrieve stored price data from last update
function getLastPrice(currency) {
  if (localStorage.getItem("lastPrice") != null) {
    return localStorage.getItem("lastPrice");
  } else {
    //If no price is stored then return today's spot price
    return getDailyPrice(currency);
  }
}

class CryptoWatch extends q.DesktopApp {

  constructor() {
    super();
    this.pollingInterval = this.getRefreshInterval() * 60 * 1000;
  }

  generateSignal(price, oldPrice) {
    const currency = this.config.currency.toUpperCase();
    const isMuted = this.config.isMuted;
    const latestPrice = price.data.amount * 1;
    const previousClose = oldPrice * 1;
    const decimals = this.getDecimalPlaces();

    const change = formatChange((latestPrice - previousClose), decimals);
    const changePercent = formatChange((change / previousClose * 100), decimals);

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
        `${currency.substr(currency.length -3)} ${round(latestPrice, decimals)} (${change} ${changePercent}%)` +
        `\nPrevious close: ${round(previousClose, decimals)}`,
      isMuted: !isMuted  
    });
  }

  async run() {
    logger.info("Crypto Watch Running.");
    const currency = this.config.currency.toUpperCase();
    const refresh = this.getRefreshInterval();
    if (currency) {
      logger.info("My currency is: " + currency);
      var oldPrice = await getLastPrice(currency);
      var price = await getPrice(currency);
      setLastPrice(price.data.amount);
      return this.generateSignal(price, oldPrice);
    } else {
      logger.info("No currency pair configured.");
      return null;
    }
  }

  async applyConfig() {
    const currency = this.config.currency.toUpperCase();
    if (currency) {
      return getPrice(currency).then((response) => {
        return true;
      }).catch((error) => {
        throw new Error("Error validating currency pair: " + currency, error);
      })
    }
  }

  getRefreshInterval() {
    //Return the refresh rate from the config, defaults to 15 minutes
		return this.config.refresh ? this.config.refresh : 15;
  }
  
  getDecimalPlaces() {
    //Return the decimal places for calculation and display, defaults to 2
		return this.config.decimals ? this.config.decimals : 2;
	}
}


module.exports = {
  formatChange: formatChange,
  getPrice: getPrice,
  getDailyPrice: getDailyPrice,
  CryptoWatch: CryptoWatch
}

const applet = new CryptoWatch();