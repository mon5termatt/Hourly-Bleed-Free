# Hourly Bleed (dev / free build)

Chrome extension that bills your distractions at your hourly rate. Local only. No license wall, no phone-home.

Forked from the Web Store build and stripped.

Original: https://chromewebstore.google.com/detail/hourly-bleed/iepnhnhcopafngccbhfocaggmfnfjpjk

## Why

Because charging **$8.99** for a few hundred lines of local JS with a client-side license check is a joke.

Also because "**free to install**" is a dodge. Yeah you can add it from the Web Store. Then it locks and hits you for $8.99 before it does anything. That's not a trial. That's a padlocked fridge you were allowed to walk up to.

The store build "protects" itself with offline ECDSA signatures checked inside the extension. Sounds fancy until you remember that check runs on your machine. Open the CRX, stub one function (or delete the file), load unpacked, done. Unforgeable crypto wrapped around a checkbox anyone can edit.

The code also screams AI product. Tutorial comments. Dead monorepo paths. The same helpers copy-pasted three times. `module.exports` in a Chrome script. Fine as a weekend toy. Not fine as paid DRM cosplay.

I'm usually not this petty. I just hate AI slop sold with no trial, no preview, nothing. Just a locked toolbar icon and a checkout link. A local distraction tally with a badge should be free, or at least tryable. This isn't.

And no, there's no TOS in the package, on the site, or anywhere I clicked that says I can't modify this. No EULA, no clickwrap, no "by installing you agree." Just a folder on my PC and a wimpy paywall.

This fork is the useful part without the tip jar and the theater. Same distraction billing. No unlock key. Nothing phones home.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** and pick this repo folder (or the extension folder inside it)
4. Disable the store version if you still have it installed

## Usage

- Set your hourly rate and billable domains in **Settings**
- Popup shows today's bill, social tax, top offenders, and the last 7 days
- Export CSV from Settings when you want receipts

## Privacy

Everything stays in `chrome.storage` on your machine. No analytics, no update checks, no license servers.
