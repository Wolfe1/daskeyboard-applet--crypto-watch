const assert = require('assert');
const t = require('../index');
const currency = 'BTC-USD';
const refresh = 4320;
const decimals = 2;
const threshold = 5;
const threshold_effect = 'BLINK'
const isMuted = true;

describe('getPrice', function () {
  it('Can get the current price', function () {
    return t.getPrice(currency).then((price) => {
      assert.ok(price, 'Error in price.');
      assert.equal(currency, price.data.base + '-' + price.data.currency, 'Currency does not match: ' + currency);
      assert.ok(price.data.amount, 'Error getting latestPrice.');
    }).catch((error) => {
      assert.fail(error);
    })
  })
});

describe('getDailyPrice', function () {
  it('Can get the daily spot price', function () {
    return t.getDailyPrice(currency, refresh).then((price) => {
      assert.ok(price, 'Error in price.');
    }).catch((error) => {
      assert.fail(error);
    })
  })
});

describe('formatChange', function () {
  it('Can handle negative numbers', function () {
    assert.equal('-1.50', t.formatChange(-1.5, decimals));
    assert.equal('-1.00', t.formatChange(-1.0, decimals));
    assert.equal('-1.00', t.formatChange(-1, decimals));
  });

  it('Can handle 0', function () {
    assert.equal('+0.00', t.formatChange(0, decimals));
    assert.equal('+0.00', t.formatChange(0.0000, decimals));
  });

  it('Can handle positive numbers', function () {
    assert.equal('+1.49', t.formatChange(1.49, decimals));
    assert.equal('+1.49', t.formatChange(1.4900032, decimals));
  });

  it('Can handle more decimal places', function () {
    assert.equal('+1.4954', t.formatChange(1.49543, 4));
    assert.equal('+1.4900', t.formatChange(1.4900032, 4));
  });
});

describe('localStorage', function () {
  it('Can get price when none is stored', function () {
    assert.ok(t.getLastPrice('BTC-USD', refresh), 'Error getting price when none is stored.');
  }),
  it('Can set current price', function () {
      assert.ok(t.setLastPrice('100'), 'Error storing price.');
  }),
  it('Can get current price', function () {
      assert.ok(t.getLastPrice('BTC-USD', refresh), 'Error getting price.');
      assert.equal(t.getLastPrice('BTC-USD', refresh), 100, 'Price does not match: ' + t.getLastPrice('BTC-USD', refresh));
  })
});

describe('CryptoWatch', () => {
  describe('#applyConfig()', () => {
    it('Can apply a valid config', () => {
      let app = new t.CryptoWatch();
      app.config = {
        currency: currency,
        threshold: threshold,
        threshold_effect: threshold_effect,
        geometry: {
          width: 1,
          height: 1,
        }
      };
      app.applyConfig().catch((error) => {
        fail(error);
      })
    });
    it('Can detect an invalid config', () => {
      let failApp = new t.CryptoWatch();
      failApp.config = {
        currency: 'FOOBARRR'
      }
      failApp.applyConfig().then(() => {
        fail("Should have failed.");
      }).catch((error) => {
        assert(error);
      })

    })
  });

  describe('#generateSignal(price)', function () {
    it('Can generate the price signal', function () {
      return buildApp().then(app => {
        const price = require('./test-price.json');
        const oldPrice = 6482.825;
        const signal = app.generateSignal(price, oldPrice);
        console.log(signal);
        assert.ok(signal);
        assert(signal.message.includes('USD'));
        assert(signal.message.includes('7882.82'));
        assert(signal.message.includes('Previous Close: 6482.82'));
        assert(signal.message.includes('+1400.00'));
        assert(signal.message.includes('+21.60%'));
      })
    })
  });

  describe('#generateSignal(price)', function () {
    it('Can generate the price signal lower', function () {
      return buildApp().then(app => {
        const price = require('./test-price.json');
        const oldPrice = 8482.825;
        const signal = app.generateSignal(price, oldPrice);
        assert.ok(signal);
        assert(signal.message.includes('USD'));
        assert(signal.message.includes('7882.82'));
        assert(signal.message.includes('Previous Close: 8482.83'));
        assert(signal.message.includes('-600.00'));
        assert(signal.message.includes('-7.07%'));
      })
    })
  });

  describe('#run()', () => {
    it('Can run the app with a different config', async function () {
      return buildApp(editedConfig).then(app => {
        return app.run().then((signal) => {
          assert.ok(signal);
          assert(signal.name.includes(currency));
          assert(signal.message.includes(currency.substr(currency.length -3)));
        }).catch((error) => {
          assert.fail(error)
        });
      });
    });
    it('Can run the app with base config', async function () {
      return buildApp().then(app => {
        return app.run().then((signal) => {
          assert.ok(signal);
          assert(signal.name.includes(currency));
          assert(signal.message.includes(currency.substr(currency.length -3)));
          assert.equal(app.getRefreshInterval(), refresh);
          assert.equal(app.getDecimalPlaces(), 2);
        }).catch((error) => {
          assert.fail(error)
        });
      });
    });
    it('Can run the app a second time with same config', async function () {
      return buildApp().then(app => {
        return app.run().then((signal) => {
          assert.ok(signal);
          assert(signal.name.includes(currency));
          assert(signal.message.includes(currency.substr(currency.length -3)));
        }).catch((error) => {
          assert.fail(error)
        });
      });
    });
  });
})



const baseConfig = {
  extensionId: 'q-applet-crypto-watch',
  geometry: {
    width: 1,
    height: 1,
  },
  applet: {
    user: {
      currency: currency,
      refresh: refresh,
      decimals: decimals,
      threshold: threshold,
      threshold_effect: threshold_effect,
      isMuted: isMuted
    }
  }
};

const editedConfig = {
  extensionId: 'q-applet-crypto-watch',
  geometry: {
    width: 1,
    height: 1,
  },
  applet: {
    user: {
      currency: currency,
      refresh: 30,
      decimals: 0,
      threshold: 0.001,
      threshold_effect: 'BREATHE',
      isMuted: false
    }
  }
};

async function buildApp(config) {
  const app = new t.CryptoWatch();
  return app.processConfig(config || baseConfig).then(() => {
    return app;
  });
}