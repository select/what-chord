#!/usr/bin/env node
const Crawler = require('crawler');
// const jsdom = require('jsdom');
const $ = require('cheerio');
const fs = require('fs');
const path = require('path');

const crawler = new Crawler({
	rateLimit: 500,
	userAgent:
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.100 Safari/537.36',
	// jQuery: jsdom,
	maxConnections: 10,
	// This will be called for each crawled page
	// callback: scanPage,
});

// #####################################
const rawPath = './data.chords.json';
// #####################################

const allItems = [];
pages = [
	'list-of-major-chords',
	'list-of-minor-chords',
	'list-of-diminished-chords',
	'list-of-augmented-chords',
	'list-of-major-7th-chords',
	'list-of-minor-7th-chords',
	'list-of-dominant-7th-chords',
	'list-of-diminished-7th-chords',
];
const urls = pages.map((page) => `https://pianochord.com/${page}`);
// https://pianochord.com/list-of-major-chords

crawler.on('drain', () => {
	fs.writeFileSync(rawPath, JSON.stringify(allItems, null, 2));
	process.stdout.write(`\nFound ${allItems.length} items\n`);
});

function to$(i, el) {
	return $(el);
}

function scanPage(error, res, done) {
	if (error) {
		process.stderr.write(error);
		return void done();
	}

	const chords = res
		.$('h2 a')
		.map(to$)
		.toArray()
		.map(($el) => ({ chordName: $el.text(), href: $el.attr('href') }));
	chords.pop(); // remove last garbage item
	console.log('chords', chords);

	crawler.queue(
		chords.map(({ chordName, href }) => ({
			uri: `https://pianochord.com${href}`,
			chordName,
			callback: (error1, res1, done1) => {
				allItems.push({
					chordName: res1.options.chordName,
					notes: $(res1.$('.chord-diagram')[0])
						.children('.chord-diagram-note')
						.map(to$)
						.toArray()
						.map(($el) => $($el.contents()[1]).text()),
				});
				done1();
			},
		}))
	);
	done();
}

// Queue a list of URLs
crawler.queue(urls.map((uri) => ({ uri, callback: scanPage })));
