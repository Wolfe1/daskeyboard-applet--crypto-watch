const assert = require('assert');
const t = require('../index');
const currency = 'BTC-USD';
const refresh = 60;

describe('getPrice', function () {
  it('can get a price', function () {
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
    return t.getDailyPrice(currency).then((price) => {
      console.info("oldPriceRefresh: " + refresh);
      assert.ok(price, 'Error in price.');
    }).catch((error) => {
      assert.fail(error);
    })
  })
});

describe('formatChange', function () {
  it('handles negative numbers', function () {
    assert.equal('-1.50', t.formatChange(-1.5));
    assert.equal('-1.00', t.formatChange(-1.0));
    assert.equal('-1.00', t.formatChange(-1));
  });

  it('handles 0', function () {
    assert.equal('+0.00', t.formatChange(0));
    assert.equal('+0.00', t.formatChange(0.0000));
  });

  it('handles positive numbers', function () {
    assert.equal('+1.49', t.formatChange(1.49));
    assert.equal('+1.49', t.formatChange(1.4900032));
  });
});

describe('CryptoWatch', () => {
  describe('#applyConfig()', () => {
    it('can apply a valid config', () => {
      let app = new t.CryptoWatch();
      app.config = {
        currency: currency,
        geometry: {
          width: 1,
          height: 1,
        }
      };
      app.applyConfig().catch((error) => {
        fail(error);
      })
    });
    it('can detect an invalid config', () => {
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
    it('generates the price signal', function () {
      return buildApp().then(app => {
        const price = require('./test-price.json');
        const oldPrice = 6482.825;
        const signal = app.generateSignal(price, oldPrice);
        assert.ok(signal);
        assert(signal.message.includes('USD'));
        assert(signal.message.includes('7882.825'));
        assert(signal.message.includes('Previous close: 6482.825'));
        assert(signal.message.includes('+1400.00'));
        assert(signal.message.includes('+21.60%'));
      })
    })
  });

  describe('#run()', () => {
    it('can run', async function () {
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

  describe('#run2()', () => {
    it('can run2', async function () {
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
      isMuted: true
    }
  }
};

async function buildApp(config) {
  const app = new t.CryptoWatch();
  return app.processConfig(config || baseConfig).then(() => {
    return app;
  });
}