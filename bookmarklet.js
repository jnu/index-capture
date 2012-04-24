/* File:         bookmarklet.js
 * Author:       Joseph Nudell
 * Last Updated: April 23, 2012
 *
 *
 * REQUIREMENTS
 *  ---
 * indexscraper.js
 *
 * 
 * ABOUT
 *  ---
 * The purpose of this script is to create an archive of a list of links on a webpage.
 * It was developed initially to download pages of statistics from various websites
 * and archive them for future parsing and analytics.
 *
 * Since this is written as a bookmarklet, all the logic is performed client-side.
 * Consequently, you must be conscientious of the same-origin policy. For example,
 * trying to archive a SERP probably will not work, since the links will probably
 * not be hosted on the same domain as the SERP. On the bright side, since this
 * is a bookmarklet, as far as the browser is concerned it originates from the 
 * target page, so anything on the target website is fair game.
 *
 * INSTALL
 *  ---
 * Copy and paste the minified version of this code into a new bookmarklet in your
 * browser. First make sure the paths point to a version of the JS libraries.
 * By default they point to the GitHub repo, which you SHOULD NOT DO IF YOU WANT A
 * STABLE VERSION OF THIS CODE! It's also slower. Including the GitHub scripts is
 * purely for convenience in development and does not guarantee continuous
 * functionality.
 *
 * USAGE
 *  ---
 * Navigate to the target directory. Highlight a link in this directory and execute
 * the bookmarklet. The script will attempt to discern all the links similar to the
 * one you highlighted on the page. It will generate a CSS selector of all the links
 * it thinks you wish to archive. You can test the accuracy of this selector by
 * moving your mouse over "TEST" in the top panel. Make any necessary adjustments
 * to the CSS selector until all and only the desired links are selected. You may
 * use any valid jQuery selectors to do this, including James Padolsey's beautiful
 * :regex selector.
 *
 * After all of your links are selected, press "GO". The script will create a dialog
 * box filled with a list of the links you selected. You also have the option at this
 * point of refining the list of links by using more regular expressions to target
 * either the link text, the link href, or both. See indexscraper.js DOCUMENTATION
 * for details. Once you are finished filtering, press "Download". The script will
 * commence downloading all of these links. When it is finished, it will pop out a
 * Zip archive as a download. You now have an archive of this directory!
 *
 * LIMITATIONS & BUGS
 *  ---
 * 1. The script uses JSZip to perform zipping client side. Zipping client-side is
 * kind of a funky idea in the first place, and as you'd expect, the major problem
 * with it is file size. Anything more than one or two MBs simply will not work.
 * The glimmer of hope I have in resolving this issue is using ActionScript. Updates
 * will follow.
 *
 * 2. The size of this bookmarklet is too much for older versions of IE. The solution
 * is to include a launcher script in the bookmarklet and nothing else. I clearly
 * have not done this yet, but it will be done in the future.
 *
 * 3. There are a couple of checkboxes on the panel right now, saying "Sub-index?"
 * and "Url-Macro?" These reflect future features. They are in development, so don't
 * try to use them. The former will allow you to traverse sub-directories: for example,
 * if a directory page has an alphabetical index of sub-directories and does not allow
 * you to see all of its contents at once, you will still be able to archive everything
 * by defining two (or more) levels of traversal. The "Url-macro?" feature will allow
 * you to input a URL-template such as "http://www.example.com/?a={1}" and a range
 * such as "A-Z" in order to traverse sub-directories more programmatically (which 
 * is sometimes necessary in order to pass other options to the server such as "show
 * all"). THESE CAPABILITIES ARE IN PROGRESS! HOPEFULLY THEY WILL BE FINISHED SOON!
 *
 * 4. There is a problem with the way bootstrap.js resolves jQuery conflicts. Sometimes
 * you have to try to run the bookmarklet multiple times before it will work.
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
 
 
 
 
 /* DEVELOPMENT CODE: UPDATE BASE URL AND MINIFY TO INSTALL AS BOOKMARKLET */
javascript:(function _(){
	// CONFIGURATION
	// WARNING: Including straight from GitHub is ONLY FOR DEVELOPMENT PURPOSES!
	// This is NOT a good idea if you are trying to use a stable version of
	// the bookmarklet! Update the base URL appropriately!
	var base_url = "http://jnu.github.com/index-capture/";
	// -------------------------------------------- //
	var bootstrap_lib = base_url+"js/bootstrap.js";
	var scripts = ["jQuery:1.7.1", "jQueryUI:1.8.18", base_url+"js/jszip.js", base_url+"js/jszip-deflate.js",base_url+"js/indexscraper.js"]; 
	var styles = [base_url+"css/controlpanel.css", base_url+"css/sunny/style.css"];
	
	var get_links = function() {
		// Executes once dependencies are loaded
		(function($) {
			// --- PAYLOAD --- //
			var el = $(window).getSelectedElement();
			var path = $(el).getPath(true);
			$('body').createControlPanel(styles, scripts, _).path(path);
			// --- END PAYLOAD --- //
		})( BS.$ ); // Using bootstrapped jQuery
	};
	
	// Commence amusingly complicated bootstrapping procedure. 
	var loader = function(callback) {
		// This is basically jQuery's loadScript
		var head = document.getElementsByTagName("head")[0];
		var script = document.createElement("script");
		var done = false;
		script.src = bootstrap_lib;
		script.onload = script.onreadystatechange = function() {
			if( !done && ( !this.readyState || this.readyState == "loaded" || this.readyState == "complete") ) {
				done = true;
				BS.loadLibs(scripts, function() {
					installScraper(BS.$);
					callback();
				});
				// This bookmarklet installs itself in BS namespace for further propagation
				// and persistence.
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