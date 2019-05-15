const assert = require('assert');
const t = require('../index');
const currency = 'BTC-USD';
const refresh = 1440;
const companyName = 'Apple Inc.';

describe('getQuote', function () {
  it('can get a quote', function () {
    return t.getQuote(currency).then((quote) => {
      assert.ok(quote, 'Error in quote.');
      assert.equal(currency, quote.data.base + '-' + quote.data.currency, 'Currency does not match: ' + currency);
      assert.ok(quote.data.amount, 'Error getting latestPrice.');
    }).catch((error) => {
      assert.fail(error);
    })
  })
});

describe('getOldQuote', function () {
  it('can get an old quote', function () {
    return t.getOldQuote(currency, refresh).then((quote) => {
      assert.ok(quote, 'Error in quote.');
      assert.equal(currency, quote.data.base + '-' + quote.data.currency, 'Currency does not match: ' + currency);
      assert.ok(quote.data.amount, 'Error getting latestPrice.');
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

  describe('#generateSignal(quote)', function () {
    it('generates the quote', function () {
      return buildApp().then(app => {
        const quote = require('./test-quote.json');
        const oldQuote = require('./test-quote-old.json');
        const signal = app.generateSignal(quote, oldQuote);
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