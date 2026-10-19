# Hourly Bleed (dev / free build)

Chrome extension that bills your distractions at your hourly rate. Local-only — no license wall, no phone-home.

Forked from the Web Store build and stripped.

Original: https://chromewebstore.google.com/detail/hourly-bleed/iepnhnhcopafngccbhfocaggmfnfjpjk

## Why

Because charging **$8.99** for a few hundred lines of local JS with a client-side license check is a joke.

Also because “**free to install**” is a dodge. You can add it from the Web Store, sure — then it immediately locks and asks for $8.99 before it does anything. That is not a trial. Calling it free to install is like calling a padlocked fridge free to walk up to.

When called on it, the author waved it off as *“Fair point, it's a Chrome extension rather than a website… Free to install if you want to try it”* plus a store link. That is not a valid answer. The product is the extension. If the extension is bricked until you pay, it is not free to try.

The store build “protects” itself with offline ECDSA signatures verified in the extension. That sounds serious until you remember the gate runs on the user’s machine — open the CRX, stub one function (or delete the file), load unpacked, done. Crypto that can’t be forged, wrapped around a checkbox anyone can edit.

The code also reads like AI product: tutorial comments, dead monorepo paths, duplicated helpers, `module.exports` in a Chrome script. Fine as a weekend toy. Not fine as a paid DRM cosplay.

I'm usually not this petty. I just hate shipping AI slop as a paid product with no trial, no preview, nothing — just a locked toolbar icon and a checkout link. A local distraction tally with a badge is the kind of thing that should be free (or at least tryable). This isn't.

So this fork exists to run the useful part without the tip jar or the theater. Same distraction billing. No unlock key. Nothing phones home.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this repo folder (or the extension folder inside it)
4. Disable the store version if you still have it installed

## Usage

- Set your hourly rate and billable domains in **Settings**
- Popup shows today’s bill, social tax, top offenders, and the last 7 days
- Export CSV from Settings when you want receipts

## Privacy

Everything stays in `chrome.storage` on your machine. No analytics, no update checks, no license servers.
