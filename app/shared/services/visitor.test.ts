import { test, equal } from "@elements/app";
import { countryOf, deviceOf, referrerOf, visitorOf } from "./visitor";

test("visitor", () => {
  test("referrer is the host without www", () => {
    equal(referrerOf("https://www.google.com/search?q=x"), "google.com");
    equal(referrerOf("https://news.ycombinator.com/item?id=1"), "news.ycombinator.com");
  });

  test("no referrer, a bad one, or our own host is direct", () => {
    equal(referrerOf(""), "direct");
    equal(referrerOf("not a url"), "direct");
    equal(referrerOf("http://localhost:4000/", "localhost:4000"), "direct");
  });

  test("device from user agent", () => {
    equal(deviceOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15"), "desktop");
    equal(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148"), "mobile");
    equal(deviceOf("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36"), "mobile");
    equal(deviceOf("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "tablet");
    equal(deviceOf("Mozilla/5.0 (Linux; Android 13; SM-X700) Safari/537.36"), "tablet");
    equal(deviceOf("Slackbot-LinkExpanding 1.0"), "bot");
    equal(deviceOf("curl/8.4.0"), "bot");
    equal(deviceOf(""), "bot");
  });

  test("country prefers a cdn header, then the language region", () => {
    equal(countryOf({ "cf-ipcountry": "de" }), "DE");
    equal(countryOf({ "cf-ipcountry": "XX", "accept-language": "fr-CA,fr;q=0.9" }), "CA");
    equal(countryOf({ "accept-language": "en" }), "unknown");
    equal(countryOf({}), "unknown");
  });

  test("visitorOf reads all three", () => {
    equal(
      visitorOf({ referer: "https://x.com/a", "user-agent": "iPhone Mobile", "accept-language": "pt-BR" }),
      { referrer: "x.com", country: "BR", device: "mobile" },
    );
  });
});
