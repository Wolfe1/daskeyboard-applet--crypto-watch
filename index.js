const q = require('daskeyboard-applet');
const request = require('request-promise');
const localStorage = require('localStorage');
const moment = require('moment');
const logger = q.logger;

const apiUrl = 'https://api.coinbase.com/v2/prices/';

async function getPrice(currency) {
  var data = await request.get({
    url: apiUrl + currency + '/spot',
    json: true
  });
  return data;
}

async function getDailyPrice(currency, refreshInterval) {
  var dt = moment().subtract(refreshInterval, 'minutes').format();
  var dailyUrl = apiUrl + currency + '/spot?date=' + dt;
  logger.info("url: " + dailyUrl);
  var data = await request.get({
    url: dailyUrl,
    json: true
  });
  return data.data.amount;
}

function round(number, decimals) {
  return (number * 1).toFixed(decimals);
}

function formatChange(number, decimals) {
  number = number * 1;
  if (number >= 0) {
    return `+${round(number, decimals)}`;
  } else {
    return `${round(number, decimals)}`;
  }
}

// Store price obtained from last update
function setLastPrice(price) {
  localStorage.setItem("lastPrice", price);
  return true;
}

// Retrieve stored price data from last update
function getLastPrice(currency, refreshInterval) {
  if (localStorage.getItem("lastPrice") != null) {
    return localStorage.getItem("lastPrice");
  } else {
    // If no price is stored then return spot price based on refresh time (days).
    return getDailyPrice(currency, refreshInterval);
  }
}

class CryptoWatch extends q.DesktopApp {

  constructor() {
    super(); 
  }

  generateSignal(price, oldPrice) {
    const currency = this.config.currency.toUpperCase();
    const isMuted = this.config.isMuted;
    const threshold = this.config.threshold;
    const threshold_effect = this.config.threshold_effect;
    const latestPrice = price.data.amount;
    const previousClose = oldPrice;
    const decimals = this.getDecimalPlaces();

    const change = formatChange((latestPrice - previousClose), decimals);
    const changePercent = formatChange((change / previousClose * 100), 2);

    const color = (latestPrice >= previousClose) ? '#00FF00' : '#FF0000';
    var point = [new q.Point(color)];
    if (changePercent < -threshold || changePercent > threshold) {
      if (threshold_effect == 'BLINK') {
        point = [new q.Point(color, q.Effects.BLINK)];
      }
      else {
        point = [new q.Point(color, q.Effects.BREATHE)];
      }
    }
    console.log(point);
    

    
    return new q.Signal({
      points: [
        point
      ],
      link: {
        url:  'https://www.coinbase.com',
        label: 'Show on Coinbase',
      },
      name: currency +' Price',
      message:
        `${currency.substr(currency.length -3)} ${round(latestPrice, decimals)} (${change} ${changePercent}%)` +
        "\n" +
        `Previous Close: ${round(previousClose, decimals)}`,
      isMuted: !isMuted
    });
  }

  async run() {
    logger.info("Crypto Watch Running.");
    const currency = this.config.currency.toUpperCase();
    logger.info("My currency is: " + currency);
    var oldPrice = await getLastPrice(currency, this.getRefreshInterval());
    var price = await getPrice(currency);
    setLastPrice(price.data.amount);
    return this.generateSignal(price, oldPrice);

  }

  async applyConfig() {
    logger.info("Crypto Watch Initialisation.");
    this.pollingInterval = this.getRefreshInterval() * 60000;

    const currency = this.config.currency;
    if (currency) {
      return getPrice(currency).then(() => {
        return true;
      }).catch((error) => {
        throw new Error("Error validating currency pair: " + currency +", " + error);
      })
    }
  }

  getRefreshInterval() {
    //Return the refresh rate from the config, defaults to 15 minutes
		return this.config.refresh ? this.config.refresh : 15;
  }
  
  getDecimalPlaces() {
    //Return the decimal places for calculation and display, defaults to 2
		return this.config.decimals;
	}
}

module.exports = {
  formatChange: formatChange,
  getPrice: getPrice,
  getDailyPrice: getDailyPrice,
  setLastPrice: setLastPrice,
  getLastPrice: getLastPrice,
  CryptoWatch: CryptoWatch
}

new CryptoWatch();