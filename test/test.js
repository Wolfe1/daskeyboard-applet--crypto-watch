const assert = require('assert');
const t = require('../index');
const currency = 'BTC';
const companyName = 'Apple Inc.';

// describe('getQuote', function () {
//   it('can get a quote', function () {
//     t.getQuote(currency).then((quote) => {
//       //assert.ok(quote, 'Quote was not truthy.');
//       console.log(quote.data);
//       var dt = new Date();
//       dt.setHours(dt.getHours() - 1);
//       console.log(dt);
//       assert.equal(currency, quote.data.base, 'currency does not match: ' + currency);
//       assert.ok(quote.data.amount, 'quote.latestPrice was not truthy.');
//     }).catch((error) => {
//       assert.fail(error);
//     })
//   })
// });

// describe('getOldQuote', function () {
//   it('can get an old quote', function () {
//     t.getOldQuote(currency).then((quote) => {
//       //assert.ok(quote, 'Quote was not truthy.');
//       console.log(quote.data);
//       assert.equal(currency, quote.data.base, 'currency does not match: ' + currency);
//       assert.ok(quote.data.amount, 'quote.latestPrice was not truthy.');
//     }).catch((error) => {
//       assert.fail(error);
//     })
//   })
// });

// describe('formatChange', function () {
//   it('handles negative numbers', function () {
//     assert.equal('-1.50', t.formatChange(-1.5));
//     assert.equal('-1.00', t.formatChange(-1.0));
//     assert.equal('-1.00', t.formatChange(-1));
//   });

//   it('handles 0', function () {
//     assert.equal('+0.00', t.formatChange(0));
//     assert.equal('+0.00', t.formatChange(0.0000));
//   });

//   it('handles positive numbers', function () {
//     assert.equal('+1.49', t.formatChange(1.49));
//     assert.equal('+1.49', t.formatChange(1.4900032));
//   });
// });

// describe('CryptoWatch', () => {
//   describe('#applyConfig()', () => {
//     it('can apply a valid config', () => {
//       let app = new t.CryptoWatch();
//       app.config = {
//         currency: currency,
//         geometry: {
//           width: 1,
//           height: 1,
//         }
//       };
//       app.applyConfig().catch((error) => {
//         fail(error);
//       })
//     });
//     it('can detect an invalid config', () => {
//       let failApp = new t.CryptoWatch();
//       failApp.config = {
//         currency: 'FOOBARRR'
//       }
//       failApp.applyConfig().then(() => {
//         fail("Should have failed.");
//       }).catch((error) => {
//         assert(error);
//       })

//     })
//   });

  describe('#generateSignal(quote)', function () {
    it('generates the quote', function () {
      return buildApp().then(app => {
        const apiUrl = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
        var dt = new Date();
        dt.setHours(dt.getHours() - 1);
        console.log(apiUrl + '?date=' + dt.toJSON());
        const quote = require('./test-quote.json');
        const oldQuote = require('./test-quote-old.json');
        const signal = app.generateSignal(quote, oldQuote);
        console.log(JSON.stringify(signal));
        assert.ok(signal);
        assert(signal.message.includes('BTC'));
        assert(signal.message.includes('USD 181.94'));
        assert(signal.message.includes('Previous close: USD 178.58'));
        assert(signal.message.includes('+3.36')); // latestPrice - previousClose
        assert(signal.message.includes('+1.88%'));
      })
    })
  });

//   describe('#run()', () => {
//     it('can run', async function () {
//       return buildApp().then(app => {
//         return app.run().then((signal) => {
//           assert.ok(signal);
//           assert(signal.name.includes(currency));
//           assert(signal.message.includes(currency));
//           assert(signal.message.includes(companyName));
//         }).catch((error) => {
//           assert.fail(error)
//         });
//       });
//     });
//   });
// })

const baseConfig = {
  extensionId: 'q-applet-crypto-watch',
  geometry: {
    width: 1,
    height: 1,
  },
  applet: {
    user: {
      currency: currency
    }
  }
};

async function buildApp(config) {
  const app = new t.CryptoWatch();
  return app.processConfig(config || baseConfig).then(() => {
    return app;
  });
}