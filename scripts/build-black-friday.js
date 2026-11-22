#!/usr/bin/env node
/*
 * build-black-friday.js
 * Run after every edit to black-friday-deals.js:   node scripts/build-black-friday.js
 *
 * 1. Writes every live deal card straight into black-friday.html (between the
 *    bf-static markers inside #bfDeals) so Google reads the hotel names and
 *    offers without running JavaScript. The page script still re-renders the
 *    cards on load (countdown tags, filters, search), so visitors see no change.
 * 2. Stamps today's date as the "Updated" date and bumps black-friday-deals.js?v=N.
 *
 * Keep card() below in step with card() in black-friday.html (minus the
 * countdown tag, which depends on the visitor's day).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'black-friday.html');
const DATA = path.join(ROOT, 'black-friday-deals.js');
const PORTAL = 'https://wanderbywilson.travelwits.com/';

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(DATA, 'utf8'), ctx);
const deals = (ctx.window.BF_DEALS || []).filter(d => !d.hidden);
const regions = ctx.window.BF_REGIONS || [];

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const day = s => new Date(s + 'T00:00:00');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const short = s => { const d = day(s); return MONTHS[d.getMonth()] + ' ' + d.getDate() + (d.getFullYear() !== today.getFullYear() ? ', ' + d.getFullYear() : ''); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const live = deals.filter(d => day(d.bookBy) >= today);

function card(d) {
    const name = d.slug ? '<a href="/hotels/' + d.slug + '">' + esc(d.name) + '</a>' : esc(d.name);
    const details = (d.details || []).map(x => '<li>' + esc(x) + '</li>').join('');
    const isCruise = d.region === 'cruise';
    const usHref = isCruise ? '/inquire-cruise' : '/inquire-hotel?hotel=' + encodeURIComponent(d.slug || d.id);
    const actions = isCruise
        ? '<div class="bf-actions is-single"><a class="bf-btn bf-btn-portal" data-bf="us" data-deal="' + d.id + '" href="' + usHref + '">Have us book it</a></div>'
        : '<div class="bf-actions">' +
            '<a class="bf-btn bf-btn-portal" data-bf="portal" data-deal="' + d.id + '" href="' + PORTAL + '" target="_blank" rel="noopener">Book on my portal</a>' +
            '<a class="bf-btn bf-btn-us" data-bf="us" data-deal="' + d.id + '" href="' + usHref + '">Have us book it</a>' +
          '</div><p class="bf-code-note">Portal access code: <strong>WANDER</strong></p>';
    return '<article class="bf-card">' +
        '<p class="bf-place">' + esc(d.place) + '</p>' +
        (d.brand ? '<p class="bf-brand">' + esc(d.brand) + '</p>' : '') +
        '<h3 class="bf-name">' + name + '</h3>' +
        '<p class="bf-offer">' + esc(d.offer) + '</p>' +
        (details ? '<ul class="bf-details">' + details + '</ul>' : '') +
        '<dl class="bf-dates">' +
            '<div><dt>Book by</dt><dd>' + short(d.bookBy) + '</dd></div>' +
            '<div><dt>Travel</dt><dd>' + esc(d.travel) + '</dd></div>' +
        '</dl>' + actions + '</article>';
}

const html = regions.map(r => {
    const list = live.filter(d => d.region === r.key).sort((a, b) => day(a.bookBy) - day(b.bookBy));
    if (!list.length) return '';
    return '<div class="bf-region"><h3 class="bf-region-title">' + esc(r.label) + '</h3>' +
        '<div class="bf-grid">' + list.map(card).join('') + '</div></div>';
}).join('\n');

const updatedLong = LONG[today.getMonth()] + ' ' + today.getDate() + ', ' + today.getFullYear();
let page = fs.readFileSync(PAGE, 'utf8');
const START = '<!-- bf-static:start -->', END = '<!-- bf-static:end -->';
const a = page.indexOf(START), b = page.indexOf(END);
if (a < 0 || b < a) throw new Error('bf-static markers not found in black-friday.html');
page = page.slice(0, a + START.length) + '\n' + html + '\n' + page.slice(b);

page = page.replace(/(<p class="bf-updated" id="bfUpdated">)[^<]*(<\/p>)/, '$1' + live.length + ' offers · Updated ' + updatedLong + '$2');
page = page.replace(/const UPDATED = '[^']*';/, "const UPDATED = '" + updatedLong + "';");
page = page.replace(/black-friday-deals\.js\?v=(\d+)/, (m, n) => 'black-friday-deals.js?v=' + (Number(n) + 1));

fs.writeFileSync(PAGE, page);
console.log('Wrote ' + live.length + ' deal cards into black-friday.html, Updated ' + updatedLong);
