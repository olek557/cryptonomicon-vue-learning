const API_KEY =
  "f88ffe24a4cf8d303dfdd913cd3451da979f938bbba0979b590422a2e2041cc3";

const tickers = new Map();

export function subscribeToTickerUpdates(tickerName, callback) {
  tickers.set(tickerName, callback);
}

export function unsubscribeToTickerUpdates(tickerName) {
  tickers.delete(tickerName);
}

function getTickerData(tickerName) {
  return fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=${tickerName}&tsyms=USD&api_key=${API_KEY}`
  ).then((res) => res.json());
}

window.tickers = tickers;

setInterval(() => {
  tickers.forEach((callback, ticker) => {
    getTickerData(ticker).then((price) => callback(price));
  });
}, 5000);

export const getAllTickers = () => {
  return fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  )
    .then((resp) => resp.json())
    .then((tickers) => Object.keys(tickers["Data"]));
};
