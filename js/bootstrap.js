/* File:         bootstrap.js
 * Author:       Joseph Nudell
 * Last Updated: April 25, 2012
 *
 *
 * DOCUMENTATION
 *  ---
 * Library for bootstrapping required library from bookmarklet.
 * Bookmarklets are made immensely more powerful by including external JavaScript
 * libraries, but this can quickly get too complicated to do in just a bookmarklet.
 * The most notable problem with loading scripts from a bookmarklet is the race
 * condition that occurs when your bookmarklet payload depends on on the external
 * library. If you are including just one library, this is not too complicated too
 * resolve, and indeed it must be done in order to include this bootstrapping library
 * (the technique is to embed a function like jQuery's loadScript() into the bookmarklet
 * so that your payload does not execute until after the library is loaded). However,
 * if you need to include multiple scripts, the complexity of this operation quickly
 * gets to be too much: you are facing potentially multiple race conditions if one of
 * your libraries depends on another, e.g. if you are trying to load jQuery and also
 * a jQuery plugin you've defined in another file. Another problem that can occur is
 * that your script may depend on one version of a common library where the page you are
 * targetting with your bookmarklet depends on another, incompatible, version of this
 * library. This library is intented to resovle such dependencies. It will not replace
 * the global version of this library, but will create its own object with the library
 * it needs.
 *
 * The bootstrap library solves these problems by providing the function loadLibs(),
 * which you can call with a list of URLs of scripts to be loaded in the order in
 * which they are to be loaded. The function recurses throught the list as a FIFO
 * queue and executes the function you provide in the callback parameter when it is
 * finished loading.
 *
 * In addition, the library can help to simplify bookmarklets by providing convenient
 * access to common libraries such as jQuery. To use these, pass the string "lib:version"
 * in place of a URL to the loadLibs() array. The code will first check if this version
 * of the library is already used on the page. If it is not, it will fetch the (minified)
 * requested version from the web (e.g., from ajax.googleapis.com) and install it into
 * the BS namespace to avoid replacing the page's version.
 *
 * IMPORTANT - The library is in the alpha stage of development. More libraries are
 * to be added in the future, currently only jQuery and jQuery-UI shortcuts are supported.
 * THERE ARE SOME ISSUES WITH INSTALLING jQuery PLUGINS ON THE CORRECT (BS.$) VERSION OF
 * jQuery! THIS IS A BIG PROBLEM AND MUST BE FIXED SOON!
 *
 *
 * USE WITH A BOOKMARKLET
 *  ---
 * You must load the bootstrap library from your bookmarklet, and doing so necessitates
 * you do some work defeating the race condition by setting your payload as a callback
 * to the onload handler of the script. The way I recommend doing this is as follows.
 * This script hardcodes the best-practice approach to dynamically loading scripts to
 * load the bootstrap library, which will then load the rest of your scripts for you.
 *
 >  javascript:(function(){
	 	// Parameters
		var bootstrap_lib = "http://path.to/bootstrap.js";
		var my_libs = ['jQuery:1.7.1', 'http://path.to/my.jquery.plugin.js'];
		
		// Your payload code
		var my_payload = function() {
			// This can be whatever, obviously, but here is an example of
			// how to run your plugin with a the bootstrapped version of jQuery
			(function($) {
				$(document).mySweetPlugin();
			})( BS.$ );
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
					BS.loadLibs([my_libs, function() {
						callback();
					});
					script.onload = script.onreadystatechange = null;
					head.removeChild( script );
				};
			};
			head.appendChild(script);
		};
		
		// Load & Execute (be sure to only load once).
		if( typeof(bootstrap)=='undefined' ) loader(my_payload);
		else my_payload();
 *
 *
 * Too long to work in IE6, but that probably doesn't concern most people. Especially
 * because the worst case scenario is you just write a shorter version without caring
 * about the race condition, which will error out on the first attempt but work fine
 * for subsequent tries.
 *
 * Anyway, if you use that template you only have to edit the libraries to be
 * what you need them to be and the payload to be your payload and you're done! Now you
 * can construct arbitrarily complicated and exciting bookmarklets externally and
 * load them into a target page to do all sorts of complicated and wonderful things!
 *
 *
 * LICENSE
 *  ---
 * Copyright (C) 2012 Joseph Nudell
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License and Lesser permissions for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 

window.BS = {
	// Bootstrap namespace
	
	loadScript : function (url, callback, args) {
		// Best-practice script loader. Identical to jQuery's loader, but adds
		// optional args parameter which is useful for some convenience functions
		if( typeof(args)=='undefined' ) args = null;
		var head = document.getElementsByTagName("head")[0];
		var script = document.createElement("script");
		script.src = url;
		// Attach handlers for all browsers
		var done = false;
		script.onload = script.onreadystatechange = function() {
			if( !done && ( !this.readyState || this.readyState == "loaded" || this.readyState == "complete") ) {
				done = true;
				callback(args);
				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				head.removeChild( script );
			}
		};
		head.appendChild(script);
	},
	
	
	loadStyle : function( url ) {
		// Load a stylesheet. No callback is needed since there is not
		// the same sort of race condition when loading stylesheets.
		var style = document.createElement("link");
		style.setAttribute("rel", "stylesheet");
		style.setAttribute("href", url);
		document.getElementsByTagName("head")[0].appendChild(style);
		return;
	},
	
	
	_installJQuery : function(callback) {
		// Interlude to set up installed jQuery without replacing old
		if( typeof(BS.bsJQI)=='undefined' || !BS.bsJQI ) {
			BS.$ = window.$;
			BS.jQuery = window.jQuery;
			if( typeof(BS.old$)!='undefined' ) {
				window.jQuery = BS.oldjQuery; 
				window.$ = BS.old$;
			}
			BS.bsJQI = true;
		}
		callback();
	},
	
	_installJQueryPlugin : function(callback) {
		// Swap old jQuery back to page
		BS.$ = window.$;
		BS.jQuery = window.jQuery;
		window.jQuery = BS.oldjQuery;
		window.$ = BS.old$;
		callback();
	},
	
	
	
	loadJQuery: function(version, callback) {
		var jq_src = "http://ajax.googleapis.com/ajax/libs/jquery/"+version+"/jquery.min.js";
		if( typeof(jQuery)=='undefined') {
			// No jQuery lib loaded
			BS.loadScript(jq_src, BS._installJQuery, callback);
		}else if( jQuery().jquery!=version || $().jquery!=version ) {
			// Load desired jQuery lib, but keep old / whatever is in $ currently.
			BS.old$ = $;
			BS.oldjQuery = jQuery;
			BS.loadScript(jq_src, BS._installJQuery, callback);
		}else{
			// Page already uses jQuery; just alias it
			BS._installJQuery(callback);
		}
	},
	
	
	loadJQueryUI: function(version, callback, jq_version) { 
		// Note: Just like when you load jQueryUI yourself, you should
		// make sure jQuery gets loaded first. If you do not, jQuery 1.7.1
		// (which is the latest as of authoring this function) will be loaded
		// by default. THIS DOES NOT GUARANTEE COMPATIBILITY! YOU SHOULD STILL
		// LOAD THE APPROPRIATE VERSION OF jQuery YOURSELF IN ORDER TO BE SURE
		// IT WILL WORK!
		var jqui_src = "http://ajax.googleapis.com/ajax/libs/jqueryui/"+version+"/jquery-ui.min.js";
		if( typeof(BS.$)=='undefined' ) {
			// Make sure jQuery is installed.
			if( typeof(jq_version)=='undefined' ) jq_version = "1.7.1";
			BS.loadJQuery(jq_version, function() {
				BS.loadJQueryUI(version, callback);
			});
		}else{
			// jQuery is installed, install jQueryUI. Temporarily swap out
			// other version of jQuery if necessary.
			BS.old$ = window.$;
			BS.oldjQuery = window.jQuery;
			window.jQuery = BS.$;
			window.$ = BS.$;
			BS.loadScript(jqui_src, BS._installJQueryPlugin, callback);
		}
	},
	
	
	loadSWFObject: function(version, callback) {
		// Installs SWFObject
		var swfobj = "http://ajax.googleapis.com/ajax/libs/swfobject/"+version+"/swfobject.js";
		BS.loadScript(swfobj, callback);
	},
	
	
	loadJQueryPlugin: function(url, callback) {
		// Temporarily aliases BS.$ to jQuery to install plugin, does not
		// interfere with target page's jQuery.
		BS.old$ = $;
		BS.oldjQuery = jQuery;
		jQuery = BS.$;
		$ = BS.$;
		BS.loadScript(url, BS._installJQueryPlugin, callback);
	},
	
	
	
	loadLibs: function(libs, callback) {
		// Recursive function loader. Give list to libs, and callback.
		// Loads scripts as FIFO queue, calls callback when queue is empty.
		// If a library in queue is given in form "commonlib:version", the
		// script will automatically load this common library and resolve
		// version conflicts wherever possible. Currently the only library
		// available for installation in this manner is jQuery (for example,
		// call a lib "jQuery:1.7.1" to install this version of jQuery without
		// breaking dependencies for old one. New jQuery version is available
		// in bs$ variable.
		if( libs.length>0 ) {
			var lib = libs[0];
			var load_another = (function() { BS.loadLibs(libs.splice(1), callback); });
			if( /:/.test(lib) ) {
				var parts = lib.split(/:/);
				if( parts.length>2 ) parts[1] = parts.splice(1).join(":"); // something like Python's partition
				switch(parts[0]) {
					case "jQuery":
						BS.loadJQuery(parts[1], load_another);
						break;
					case "jQueryUI":
						BS.loadJQueryUI(parts[1], load_another);
						break;
					case "SWFObject":
						BS.loadSWFObject(parts[1], load_another);
						// TODO - add functions for other common libs
					case "jQueryPlugin":
						BS.loadJQueryPlugin(parts[1], load_another);
						break;
					default:
						BS.loadScript(parts.join(':'), load_another);
				}
			}else{
				BS.loadScript(lib, load_another);
			}
		}else{
			callback();
		}
	},
	
	
	loadStyles : function(sheets) {
		// Included mostly for symmetry. Function is of marginal value.
		for( var i in sheets ) BS.loadStyle(sheets[i]);
	}
	
	
};