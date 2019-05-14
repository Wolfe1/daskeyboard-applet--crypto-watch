const q = require('daskeyboard-applet');
const request = require('request-promise');
const logger = q.logger;

const apiUrl = 'https://api.coinbase.com/v2/prices/';

async function getQuote(currency) {
  var data = request.get({
    url: apiUrl + currency + '/spot',
    json: true
  });
  return data;
}

async function getOldQuote(currency) {
  var dt = new Date();
  dt.setMinutes(dt.getMinutes() - 5);
  var pastUrl = apiUrl + currency + '/spot?date=' + dt.toJSON()
  var data2 = request.get({
    url: pastUrl,
    json: true
  });
  return data2;
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

class CryptoWatch extends q.DesktopApp {

  constructor() {
    super();
    // run every 5 min
    this.pollingInterval = 5 * 60 * 1000;
  }

  generateSignal(quote, oldPrice) {
    const currency = this.config.currency;
    const previousClose = oldPrice.data.amount * 1;
    const latestPrice = quote.data.amount * 1;

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
        `${latestPrice} (${change} ${changePercent}%)` +
        `<br/>Previous close: ${previousClose}`
    });
  }

  async run() {
    logger.info("Crypto Watch Running.");
    const currency = this.config.currency;
    if (currency) {
      logger.info("My currency is: " + currency);
      return getOldQuote(currency).then(oldQuote => {
        return getQuote(currency).then(quote => {
          return this.generateSignal(quote, oldQuote);
      })}).catch((error) => {
        logger.error("Error getting price:" + error);
        if(`${error.message}`.includes("getaddrinfo")){
          return q.Signal.error(
            'Coinbase returned an error. <b>Please check your internet connection</b>.'
          );
        }
        return q.Signal.error([`Coinbase returned an error. Detail: ${error}`]);
      })
    } else {
      logger.info("No currency pair configured.");
      return null;
    }
  }

  async applyConfig() {
    const currency = this.config.currency;
    if (currency) {
      return getQuote(currency).then((response) => {
        return true;
      }).catch((error) => {
        throw new Error("Error validating currency pair: " + currency, error);
      })
    }
  }
}


module.exports = {
  formatChange: formatChange,
  getQuote: getQuote,
  getOldQuote: getOldQuote,
  CryptoWatch: CryptoWatch
}

const applet = new CryptoWatch();