import http from "k6/http";
import { check } from "k6";

const env = JSON.parse(open("./env.json")); // consider using SharedArray for large files

export let options = {
  iterations: env.iterations,
};

const serialize = (obj) => {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};

const find = (date, venue_id) => {
  const base_url = "https://api.resy.com/4/find";
  //                                       [  change date  ]           [  change venue_id  ]
  const url =
    base_url +
    `?lat=0&long=0&day=${date}&party_size=${env.party_size}&venue_id=${venue_id}`; // DCP is 42534
  const params = {
    headers: {
      Accept: `application/json, text/plain, */*`,
      "Accept-Encoding": `gzip, deflate, br, zstd`,
      "Accept-Language": `en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7`,
      Authorization: `ResyAPI api_key="${env.api_key}"`,
      "Cache-Control": `no-cache`,
      Origin: `https://resy.com`,
      Pragma: `no-cache`,
      Priority: `u=1, i`,
      Referer: `https://resy.com`,
      "Sec-Ch-Ua": `"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"`,
      "Sec-Ch-Ua-Mobile": `?0`,
      "Sec-Ch-Ua-Platform": `"macOs"`,
      "Sec-Fetch-Dest": `empty`,
      "Sec-Fetch-Mode": `cors`,
      "Sec-Fetch-Site": `same-site`,
      "User-Agent": `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36`,
      "X-Resy-Auth-Token": `${env.auth_token}`,
      "X-Resy-Universal-Token": `${env.universal_token}`,
    },
  };

  const response = http.get(url, params);
  const parsed = JSON.parse(response["body"]);
  const slots = parsed.results.venues[0].slots;

  if (slots) {
    const m = parseInt(slots.length / 2 + 1, 10);
    return slots[m].config;
  }
  return false;
};

const details = (find_results, date, commit) => {
  const url = "https://api.resy.com/3/details";
  console.log(find_results.token);
  const payload = JSON.stringify({
    commit: commit,
    config_id: find_results.token,
    day: date,
    party_size: env.party_size,
  });

  const params = {
    headers: {
      Accept: `application/json, text/plain, */*`,
      "Accept-Encoding": `gzip, deflate, br, zstd`,
      "Accept-Language": `en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7`,
      Authorization: `ResyAPI api_key="${env.api_key}"`,
      "Cache-Control": `no-cache`,
      "Content-Length": String(payload.length),
      "Content-Type": "application/json",
      Origin: `https://widgets.resy.com`,
      Pragma: `no-cache`,
      Priority: `u=1, i`,
      Referer: `https://widgets.resy.com/`,
      "Sec-Ch-Ua": `"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"`,
      "Sec-Ch-Ua-Mobile": `?0`,
      "Sec-Ch-Ua-Platform": `"macOs"`,
      "Sec-Fetch-Dest": `empty`,
      "Sec-Fetch-Mode": `cors`,
      "Sec-Fetch-Site": `same-site`,
      "User-Agent": `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36`,
      "X-Origin": `https://widgets.resy.com`,
      "X-Resy-Auth-Token": `${env.auth_token}`,
      "X-Resy-Universal-Token": `${env.universal_token}`,
    },
  };

  const response = http.post(url, payload, params);
  const parsed = JSON.parse(response["body"]);
  if (commit == 1) {
    const book_token = parsed.book_token.value;
    return book_token;
  }
};

const book = (book_token, payment_method) => {
  const url = "https://api.resy.com/3/book";

  const payload = serialize({
    book_token: book_token,
    struct_payment_method: `{"id":${payment_method}}`,
    source_id: "resy.com-venue-details",
    venue_marketing_opt_in: 0,
  });

  const params = {
    headers: {
      Accept: `application/json, text/plain, */*`,
      "Accept-Encoding": `gzip, deflate, br, zstd`,
      "Accept-Language": `en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7`,
      Authorization: `ResyAPI api_key="${env.api_key}"`,
      "Cache-Control": `no-cache`,
      "Content-Length": String(payload.length),
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: `https://widgets.resy.com`,
      Pragma: `no-cache`,
      Priority: `u=1, i`,
      Referer: `https://widgets.resy.com/`,
      "Sec-Ch-Ua": `"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"`,
      "Sec-Ch-Ua-Mobile": `?0`,
      "Sec-Ch-Ua-Platform": `"macOs"`,
      "Sec-Fetch-Dest": `empty`,
      "Sec-Fetch-Mode": `cors`,
      "Sec-Fetch-Site": `same-site`,
      "User-Agent": `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36`,
      "X-Origin": `https://widgets.resy.com`,
      "X-Resy-Auth-Token": `${env.auth_token}`,
      "X-Resy-Universal-Token": `${env.universal_token}`,
    },
  };

  const response = http.post(url, payload, params);
  const parsed = JSON.parse(response["body"]);
  console.log(parsed);
};

export default function () {
  const date = env.date;
  const venue_id = env.venue_id;
  const payment_method = env.payment_method;

  // 1.
  const find_results = find(date, venue_id);
  if (find_results) {
    // 2.
    const details_results_0 = details(find_results, date, 0);
    const book_token = details(find_results, date, 1);
    if (book_token) {
      // 3.
      const book_results = book(book_token, payment_method);
    }
  }
}
