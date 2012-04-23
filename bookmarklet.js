/* File:         bookmarklet.js
 * Author:       Joseph Nudell
 * Last Updated: April 12, 2012
 *
 *
 * REQUIREMENTS
 *  ---
 * indexscraper.js
 * downloader.php (or similar; see downloader.php for details)
 *
 * 
 * DOCUMENTATION
 *  ---
 * The purpose of this script is to load the IndexScraper on a target web-directory.
 * The code given in this file is actually the development code, with comments and
 * linebreaks. The version you'll want to add to your browser as a bookmark is the
 * minified version (which can be executed inline).
 *
 * To use this code, first make sure the paths point to a version of the JS libraries.
 * By default they point to my home local installation, which is probably not where
 * yours are. Then you can minify the code (http://fmarcia.info/jsmin/test.html) and
 * load it as a bookmark in your favorite browser.*** Then navigate to a list of
 * links on a website (e.g., a SERP), select one of the content links, and click the
 * bookmark.
 *
 * The prompt box that pops up when you click the bookmark contains a CSS selector.
 * This selector was automatically generated and is the software's best guess of
 * where the list of links you intend to download is. It is correct most of the time,
 * but not always, so some knowledge of CSS selectors and how to figure them yourself
 * is required. This prompt box is your chance to correct the script.
 *
 * When you click OK in the prompt a window (or new tab, depending on your browser)
 * pops up. There are three important things in this window. The first is the name
 * you wish your new archive to have. This has been automatically guessed for you
 * based on the URL you were visiting. The second is a box that looks like a tags
 * input. It is a tags input: the tags you enter are for filtering the list of links
 * you generated. Filtering is done by regular expression acting either on the link
 * text or link href (see DOCUMENTATION to indexscraper.js for details of the syntax
 * you should use here). The third thing on the page is the list of links itself.
 * It is the list of links that will be downloaded when you click the `download`
 * button.
 *
 * When you click `download`, a request is sent to downloader.php (or whatever script
 * you have installed in place of this to perform downloading). The default script
 * downloads silently in the background and provides no sort of status information.
 * See downloader.php for more information and plans for the future.
 *
 *
 * DETAILED INFORMATION (FOR THE CURIOUS)
 *  ---
 * This script uses a somewhat mystifying and ostensibly quite inefficient mechanism
 * for bootstrapping itself on the target page. All but four lines of the code in
 * this file are for bootstrapping an external bootstrapping script that will
 * bootstrap the libraries necessary to execute the payload. The redundancy here is
 * a bit painful, but is the only way I could think of to elegantly load and execute
 * the code. In particular, this code simultaneously solves two problems. First, I
 * needed to load two external libraries, jQuery and a jQuery plugin. Clearly, the 
 * latter (and the payload in the bookmarklet) depend on jQuery, so this must be
 * loaded first. The first problem, then, is the race condition that results from
 * loading both scripts asynchronously, or loading jQuery from within the plugin
 * script. This problem could be easily resolved by chaining the loader given in
 * this bookmarklet. However, there is an issue with this. The second problem is that
 * jQuery might already be loaded on the target page, in which case it is not
 * desirable to replace the current version. It is also not desirable to attempt to
 * use the current version. The reason is, of course, compatibility. The solution
 * is to load a usable version of jQuery if none is currently loaded while keeping
 * the page's original version in the jQuery global, as well as whatever is
 * currently loaded in $ (which may or may not be jQuery). To solve this second
 * problem just takes a little bit of extra logic, but its enough in my opinion to
 * put it into an additional library. The bootstrap.js library provides a useful
 * function loadLibs() that loads scripts sequentially and finally calls the
 * callback you give it.
 *
 * Another mysterious feature of this script is that the very code contained here
 * to load the bootstrapper to load the scraping scripts copies itself to the
 * bootstrap namespace under the name `bookmarklet`. This is used for creating
 * persistent control panel across multiple pages.
 * 
 * 
 * LICENSE
 *  ---
 * Copyright (C) 2012 Joseph Nudell
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */ 
 
 
 
 
 /* DEVELOPMENT CODE: NOT TO BE USED AS A BOOKMARKLET! YOU MUST MINIFY IT FIRST! */
javascript:(function _(){
	// CONFIGURATION
	// Make sure paths are correct. jQuery version should be right.
	var bootstrap_lib = "http://localhost/IndexScraper/js/bootstrap.js";
	var scraper_lib = "http://localhost/IndexScraper/js/indexscraper.js";
	var jszip = "http://localhost/IndexScraper/js/jszip.js";
	var jszip2 = "http://localhost/IndexScraper/js/jszip-deflate.js";
	var styles = ["http://localhost/IndexScraper/css/controlpanel.css", "http://localhost/IndexScraper/css/sunny/style.css"];
	var jquery_version = "jQuery:1.7.1";
	var jqueryui_version = "jQueryUI:1.8.18";
	
	// PAYLOAD
	var get_links = function() {
		// Main code to execute when the bookmarklet is called.
		// Wrapped in anonymous function for use in callback.
		(function($) {
			// --- EDIT MAIN CODE HERE --- //
			var el = $(window).getSelectedElement();
			var path = $(el).getPath(true);
			$('body').createControlPanel(styles, _).path(path);
			//var ep = prompt("Confirm path to links (CSS)", path);
			//$(ep).createLoaderWithLinks();
			// --- END MAIN CODE --- //
		})( BS.$ ); // Use bootstrapped jQuery
	};
	
	// Commence amusingly complicated bootstrapping procedure. 
	var loader = function(callback) {
		var head = document.getElementsByTagName("head")[0];
		var script = document.createElement("script");
		var done = false;
		script.src = bootstrap_lib;
		script.onload = script.onreadystatechange = function() {
			if( !done && ( !this.readyState || this.readyState == "loaded" || this.readyState == "complete") ) {
				done = true;
				BS.loadLibs([jquery_version, jqueryui_version, jszip, jszip2, scraper_lib], function() {
					installScraper(BS.$);
					callback();
				});
				BS.bookmarklet = _;
				script.onload = script.onreadystatechange = null;
				head.removeChild( script );
			};
		};
		head.appendChild(script);
	};
	
	// Load & Execute.
	if( typeof(indexScraperLoaded)=='undefined' || !indexScraperLoaded ) loader(get_links);
	else get_links();
})();