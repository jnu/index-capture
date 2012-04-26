/* File:         indexscraper.js
 * Author:       Joseph Nudell
 * Last Updated: April 24, 2012
 *
 * REQUIREMENTS
 *  ---
 * - Uses the zip creating functions of JSZip (included)
 * - jQuery (tested on 1.7.1)
 * - jQuery-UI (tested on 1.8.18)
 *
 * WARNING
 *  ---
 * Script is very rough. Hope to polish soon. Documentation at least is correct.
 *
 * ABOUT
 *  ---
 * The purpose of this script is to extract a list of links from a table or
 * table-like structure (e.g., <ul/>, nested <div/>, etc.) from an HTML document.
 * This code is loaded from a bookmarklet (see bookmarklet.js for more info).
 *
 * In order to limit the already excessive amount of scripts that must be loaded
 * to get this app to work, all of the UI elements are generated at various places
 * in this script. Very ugly but I've tried to comment pedantically.
 * 
 * DOCUMENTATION
 *  ---
 * This script is designed as a jQuery plugin. IMPORTANTLY it does NOT install
 * automatically when the script is loaded. Instead, you must manually call the
 * function installScraper() manually, passing as an argument the instance of
 * jQuery you wish to use. The motivation for this extra step is that the script
 * is designed to be loaded from a bookmarklet into a target page. This target
 * page may or may not use jQuery, and if they do, the jQuery version might not
 * be compatible. They might use a different library which uses the $ variable
 * for something entirely different. Since this is the case, the bookmarklet is
 * designed to bootstrap a good version of jQuery if it is not already loaded in
 * a way that will not break the page's scripts. The scraper plugin can then be
 * installed easily on the bootstrapped instance of jQuery by passing this version
 * (which should be stored in bs$) to installScraper(). 
 *
 * After installing the scraper, you can use the following functions to interact
 * with the scraper.
 *
 * - $.getSelectedElement()	Call this on a window. It will return the element
 *							selected in this window.
 *
 * - $.getPath() 		Call this on an element. This function will inspect the
 *  					selected text in the window and returns its path as a
 * 						CSS selector (string). If the argument 'true' is passed,
 *						the method will try to determine the path to a list of
 *						elements similar to this one. It is not always right, but 
 * 						it very often is.
 * - $.createControlPanel()	
 *						Doesn't really matter what you call this on. It will
 *						create a control panel and place it in the body of the
 *						active window.
 * - $.path([selector])	Call this on a control panel. It gets and sets the text
 *						input within the control panel that holds the CSS
 *						selector. You can modify this path so that it accurately
 *						selects all of the elements you want it to. I've also
 * 						included James Padolsey's jQuery :regex selector extension
 *						to make the targeting power of the paths here incredibly
 *						precise (or at least as precise as your regex!).
 * 
 * The rest of the functions in this script, while important, are called by the
 * aforementioned functions, so you probably won't have to deal with them. See
 * the comments to the functions for information about them. None is terribly
 * complicated.
 *
 * Another feature of this script is the FilterTag object. These objects are used
 * to allow the user to filter the list of links according to either link text or
 * href using regular expressions. See the comments to this object for information
 * on the syntax used for regular expressions and other information on this object.
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
  
  
  
  
  
 
 /* ******* *\
  * Objects *
 \* ******* */
function FilterTag(raw_tag) {
	/* Take a raw_tag (String) and parse out mode parameters.
	 * Creates an instance of a FilterTag Object.
	 * Syntax for FilterTag raw_tag:
	 *  Specify mode flags before a colon (:) and the text of the tag
	 *  after the colon. Mode flags are as follows (asterisks mark default mode):
	 *     r		RegEx - The text of the tag is a regular expression.
	 *                       RegEx should be given as in JS, e.g. "/Sample/gi"
	 *                       (without quotes) will match every substring "sample"
	 *                       irrespective of case. (Note the 'g' flag will never
	 *                       be needed since one match is enough for filtering.
	 *     t *      Text - The text of the tag is plain text (not RegEx).
	 *     -
	 *     u        Search for text in URL (i.e., href attribute of the anchor tag).
	 *     d        Search for text in the displayed text of the anchor tag.
	 *     b *      Search for text in URL and displayed text.
	 *
	 * Here's an example:
	 * > var filter_javascript = FilterTag("ru:/^javascript:/i");
	 * This will create a FilterTag for matching javascript links (e.g.,
	 * <a href="JavaScript:foo();">bar</a> will be matched).
	 */
	 // Defaults
	this.raw = raw_tag;
	this._modeflags = '';
	this.search_url = true;
	this.search_text = true;
	this.text = '';
	this.reflags = '';
	this.pattern = new RegExp(this.text, this.reflags);
	// Parse and fill out attributes
	var splitten = raw_tag.split(':');
	if( splitten.length == 1 ) {
		// No mode specified
		this.text = splitten[0];
		this.pattern = new RegExp(splitten[0], this.reflags);
	} else {
		// Extract mode
		this._modeflags = splitten[0];
		splitten[0] = '';
		this.text = splitten.join('');
		if( this._modeflags.length > 2 ) throw "ModeFlagLengthError";
		if( /[^rtudb]/.test(this._modeflags) ) throw "ModeFlagValueError";
		if( /r/.test(this._modeflags) && /t/.test(this._modeflags) ) throw "ModeFlagValueConflictError";
		if( (/u/.test(this._modeflags) && /d/.test(this._modeflags)) ||
			(/u/.test(this._modeflags) && /b/.test(this._modeflags)) ||
			(/d/.test(this._modeflags) && /b/.test(this._modeflags)) ) throw "ModeFlagValueConflictError";
		if( /r/.test(this._modeflags) ) {
			// Parse Regex
			reparts = this.text.match(/^\/(.+)\/([^\/]*)$/);
			if( reparts == null ) throw "FilterTagRegExpError";
			this.pattern = new RegExp(reparts[1], reparts[2]);
		}
		if( !/u|b/.test(this._modeflags) ) {
			// Don't search URL
			this.search_url = false;
		}
		if( !/d|b/.test(this._modeflags) ) {
			// Don't search text
			this.search_text = false;
		}
	}
	// METHODS
	// matches: Test an Anchor Element against the internal pattern.
	//    Returns boolean indicating whether a match was found according
	//    to the instances pattern.
	this.matches = function(a) {
		_m = false;
		if( this.search_text ) _m = _m || this.pattern.test(a.innerHTML);
		if( this.search_url ) _m = _m || this.pattern.test(a.href);
		return _m;
	}
}





/* ************** *\
 * jQuery Plugins *
\* ************** */
var installScraper = function(jqlib) {
	// Main code to install jQuery plugins. Wrapped so it can be called
	// as a callback to loadScript bootstrapper below (to make sure
	// jQuery has actually been loaded).
	(function( $ ) {
		
		/// Control Panel Functions ///
		$.fn.createControlPanel = function(style_urls, script_urls, code, index, paths) {
			if(typeof(code)=='undefined') code = function(){ return false; };
			if(typeof(index)=='undefined') index = window.location.href;
			if(typeof(paths)=='undefined') paths = '';
			if( $('#indexScraper_controlPanel').length<1 ) {
				if( typeof(style_urls)=='undefined' ) style_urls = ['http://jnu.github.com/index-capture/css/controlpanel.css'];
				if( typeof(script_urls)=='undefined' ) script_urls = [];
				// Create a control panel on the target page for proofing and load styles
				// Styles must be saved in global namespace to be reloaded in the future.
				// Unlike scripts, stylesheets are not applied to pages if their links
				// are wiped from the document through e.g. document.open(). 
				// UPDATE: Mozilla will throw cleared-scope error if scripts are not loaded
				// after doument.open()! Chrome does not do this! Save Scripts too!
				BS.styles = style_urls;
				BS.scripts = script_urls;
				BS.loadStyles(BS.styles);
				var cp = document.createElement('div');
				cp.setAttribute('id', 'indexScraper_controlPanel_contain');
				cp.innerHTML = '<div id="indexScraper_controlPanel" class="ui-widget ui-corner-bottom ui-widget-header"></div>';
				document.getElementsByTagName('body')[0].appendChild(cp);
				$('#indexScraper_controlPanel').html("<form id='cp_form'><div id='urlfields'><input type='text' id='url' class='ui-corner-all ui-form-default' /><input type='text' id='urlpattern' class='ui-form-default ui-corner-all' /></div><span id='pathbox'><input type='text' id='path' class='ui-form-default ui-corner-all' /></span><span id='test'>TEST</span><input type='submit' id='go' value='Go' class='ui-form-default' /><span id='subchk'><input type='checkbox' id='subindex' class='ui-form-default' />Sub-index?</span><span id='urlchk'><input type='checkbox' id='urlmacro' class='ui-form-default' />Url Macro?</span><input type='hidden' id='main_index' value='"+index+"' /><ol id='paths' style='visibility:hidden'>"+paths+"</ol></form>");
				$('#indexScraper_controlPanel #test').css('left', $('#indexScraper_controlPanel #go').offset().left+$('#indexScraper_controlPanel #go').width()+50+'px'); // position TEST to right of GO button
				$('#indexScraper_controlPanel #go').button();
				$('#indexScraper_controlPanel').height('34px');
				$('#indexScraper_controlPanel #urlfields').hide();
				$('#indexScraper_controlPanel #urlmacro').click(function() {
					if( $(this).is(':checked') ) {
						$('#indexScraper_controlPanel #urlfields').css({top: $('#indexScraper_controlPanel').height()+'px', position: 'absolute', left: '5px'});
						if( $('#indexScraper_controlPanel #url').val()=='' ) $('#indexScraper_controlPanel #url').val(window.location.href);
						$('#indexScraper_controlPanel #urlfields').fadeIn('fast', function() {
							$('#indexScraper_controlPanel').height($('#indexScraper_controlPanel').height()+$('#indexScraper_controlPanel #urlfields').height());
						});
							
					}
					else $('#indexScraper_controlPanel #urlfields').fadeOut('fast', function() {
						$('#indexScraper_controlPanel').height($('#indexScraper_controlPanel #path').height()+8);
						});
				});
				$('#indexScraper_controlPanel #cp_form').submit(function() {
					// Control Panel Submit ('Go' button) actions.
					var newpath = $('#indexScraper_controlPanel').path();
					$('#indexScraper_controlPanel #paths').append('<li>'+newpath+'</li>');
					if($('#indexScraper_controlPanel #urlmacro').is(':checked')) {
						// Create index by doing GET-variable substitution according to given URL template and pattern
						var bits = $('#indexScraper_controlPanel #urlpattern').explodePattern();
						var urls = new Array();
						for( var i in bits )
							urls.push($('#indexScraper_controlPanel #url').val().replace(/\{1\}/, bits[i]));
						// Create loader with URLs
						$('#indexScraper_controlPanel').createLoaderWithLinks(urls);
					}else{
						if($('#indexScraper_controlPanel #subindex').is(":checked")) {
							// Has sub-index: navigate to first of selected links and set up control panel persistently
							var paths = $('#indexScraper_controlPanel #paths').html();
							var url = $(newpath)[0].href;
							$('#indexScraper_controlPanel #url').val(url);
							$.get(url, function(newpage) {
								document.open();
								document.write(newpage);
								document.close();
								$('body').createControlPanel(style_url, code, index, paths);
							});
						}else{
							// No sub-indexes: create loader
							$('#indexScraper_controlPanel').createLoaderWithLinks();
						}
					}
					return false;
				});
				$('#indexScraper_controlPanel #test').hover(function() {
					$($('#indexScraper_controlPanel').path()).each(function(i, me) {
						if(me.tagName=='A') $(me).toggleClass('ixsc_highlight');
						else $(me).each.find('a').toggleClass('ixsc_highlight');
					});
				});
			}
			return $('#indexScraper_controlPanel');
		};
		
		$.fn.path = function(path) {
			// Not to be confused with getPath below. This gets and sets the control
			// panel's path input; call on control panel div.
			if( typeof(path)=='undefined' ) {
				// Get
				return this.find('#path').val();
			}else{
				// Set
				this.find('#path').val(path);
				return this;
			}
		};
		
		/// End Control Panel Functions ///
		
		$.fn.createLoaderWithLinks = function(urls) {
			// Call this on control panel. Open new window with all links in path.
			var cur_url = this.find('#main_index').val();
			var main_part = cur_url.match(/(?:ht|f)tps?:\/\/(?:www\d*\.)?([\d\w\-]+?)\./i);
			if( main_part )
				main_part = main_part[1];
			else
				main_part = "dl";
			var links_code = '<a href="'+cur_url+'">index</a>';
			var pathsQueue = [];
			if( typeof(urls)!='undefined' ) {
				// If urls are defined, add a list of them as the first element of pathsQueue.
				// This will enable their traversal via the recurse closure below.
				var links = new Array();
				for( var x in urls ) {
					var g = document.createElement('a');
					g.href = urls[x];
					links.append(g);
				}
				pathsQueue.push(links);
			}
			// Note that paths get appended after the URLs, if present. If the URLs are present,
			// there will probably be just one path, but this is not necessarily the case if for
			// some reason someone is performing a sub-indexed URL macro.
			this.find('#paths li').each(function(i, me) {
				// Quick way to decode HTML entities via jQuery
				pathsQueue.push($('<div/>').html(me.innerHTML).text());
			});
			
			function recurse(paths, callback) {
				if( paths.length==1 ) {
					var _links = '';
					$(paths[0]).each(function(i, me) {
						// Make an element full of slimmed down links from this node.
						if( me.nodeName!='A' ) {
							$(me).find('a').each(function(i, a) {
								var new_a = document.createElement('a');
								new_a.href = a.href;
								new_a.innerHTML = a.innerHTML;
								_links += '<div><a href="' + new_a.href + '">' + $(new_a).text() + '</a></div>';
							});
						}else{
							var new_a = document.createElement('a');
							new_a.href = me.href;
							new_a.innerHTML = me.innerHTML;
							_links += '<div><a href="' + new_a.href + '">' + $(new_a).text() + '</a></div>';
						}
					}); // End for-each
					if(typeof(callback)!='undefined') {
						// Callback if it's given
						callback(_links);
					}else{
						return _links;
					}
				}else{ // This is not a leaf page, so proceed to sub-indexes
					var length = $(paths[0]).length;
					var curp = paths.splice(1);
					var cnt = 0
					$(paths[0]).each(function(i, me) {
						$.get(me.href, function(html) {
							document.open();
							document.write(html);
							document.close();
							links_code += recurse(curp);
							cnt+=1;
							if(cnt==length && typeof(callback)!="undefined") {
								// Excecute callback only after last entry is gotten
								callback(links_code);
							}
						});
					});
				}
			}
			
			
			var createPanelFn = function() {
				recurse(pathsQueue, function(links) {
					links = '<div><a href="'+window.location.href+'">INDEX</a></div>'+links;
					var loader_scr = '(function($){$("#download").click(function() { var name = ($("#name").val()!="")? $("#name").val() : "download"; $("#queue").submitLinkDownloadRequest(name);}); $("#filter").button(); $("#filter").click(function() { $("#queue").filterLinks("#tagsbox .tag span"); $("#count span").text($("#queue").find("a").length-1); }); $("#tags").tagsInput(); $("#count span").text($("#queue").find("a").length-1);})(BS.$);';
					var child_code = '<div id="upper"><div id="count">Found <span></span> links (not counting index itself)</div><input type="text" id="name" value="'+main_part+'" /><div><button id="filter">Filter Results</button><div id="tagsbox"><input name="tags" id="tags" /></div></div><button id="download">Download</button></div><div id="queue">' + links + '</div><script type="text/javascript">'+loader_scr+'</script>';
					BS.styles.push("http://jnu.github.com/index-capture/css/jquery.tagsinput.css");
					BS.loadStyles(BS.styles);
					BS.scripts.push("jQueryPlugin:http://jnu.github.com/index-capture/js/jquery.tagsinput.min.js");
					BS.loadLibs(BS.scripts, function() {
						BS.$('body').append('<div id="downloader_panel"/>');
						BS.$('#downloader_panel').dialog({height: 'auto', width: '400px', closeOnEscape: true, minHeight: '300px', modal: true, autoOpen: true, title: 'Downloader', position: 'top'});
						BS.$('#downloader_panel').html(child_code);
						BS.$('#download').button();
						
						// Insert Flash object into page
						BS.$('#downloader_panel').append('<div id="indexCapture_icHelper"><p>You must update your Flash player!</p></div>');
						var flashvars = {},
							params = {},
							attributes = {};
						params.allowscriptaccess = "always";
						params.allownetworking = "all";
						attributes.id = "ichelper";
						swfobject.embedSWF("http://localhost/IndexScraper/flash/ichelper.swf",
										   "indexCapture_icHelper", "140", "30", "10.0.0", false, flashvars, params, attributes);
						$('#ichelper').css('visibility','hidden');
					});
					//wndw.document.write(child_code);
					//return $(wndw);
				});
			};
			
			// Execute
			if( pathsQueue.length>1 ) {
				// Only reload main index if there are multiple pages to be looked at
				// => This means we are probably not seeing the main index page on the screen right now.
				$.get(cur_url, function(html) {
					document.open();
					document.write(html);
					document.close();
					createPanelFn();
				});
			}else {
				// Otherwise just execute the function to recurse the list of links.
				// This will prevent asynchronously loaded links from an index being lost upon refresh.
				createPanelFn();
			}
				
		};
		
		
		
		
		$.fn.submitLinkDownloadRequest = function(name, overwrite) {
			// Submit a download request for all links contained in this.
			// Returns null -- NOT CHAINABLE!
			if( typeof(name)=='undefined' ) name = 'dl';
			if( typeof(overwrite)=='undefined' ) overwrite = false;
			
			// Flash should be inserted already
			
			// XXXXXXXXXXXXXXXXXXXXX USE $.GET AND JSZIP FOR IN-HOUSE ZIPPING
			// Use $.GET and AS3 helper for client-side zipping
			$('#downloader_panel #upper').html('<div id="progressbar"/>');
			$('#downloader_panel #progressbar').progressbar();
			//var zip = new JSZip();
			// INIT FLASH ZIP
			$('#ichelper')[0].createZip(name);
			var traverse = function(el, callback) {
				var cnt = 0;
				var max_ = el.find('a').length;
				el.find('a').each(function(i, me) {
					//var myname = me.innerText;
					//var href = me.href;
					//links.push([href, myname]);
					$.get(me.href, function(data) {
						// Submit asynchronous request for full HTML of page
						/*  JSZIP STUFF
						var sname = name+'-'+me.innerText.replace(/[^a-z0-9]/ig, ''); // sanitized name
						var n = 0;
						while(zip.file(sname)!=null) {
							// Avoid overwriting by tacking -n to end of file name
							// (e.g. will name file 'index-2' if 'index' and 'index-1'
							// are already used).
							if(n++) sname = sname.substr(0, sname.lastIndexOf('-')); // get main part if -n is already on
							sname+='-'+n;
						}
						zip.file(sname, data); // store data in file
						*/
						var sname = me.innerText.replace(/[^a-z0-9]/ig, '');
						var _ecnt = 0;
						var _emax = 5;
						while( !$('#ichelper')[0].addFileToZip(sname, data) && _ecnt++<_emax ) {
							 // ICHELPER returns false if there was an error adding file to zip.
							 // Might have to retry $.get altogether on error
							 console.log("Error adding '"+sname+"' to zip. Retrying ("+_ecnt+") ...");
						}
						cnt+=1;
						//$(me).addClass('ui-state-disabled');
						if(_ecnt==_emax) {
							// There was an error zipping this file.
							$(me).css('color', '#f00');
						}else{
							$(me).fadeOut('fast');
						}
						var r = cnt/max_*100;
						$('#downloader_panel #progressbar').progressbar('value', r);
						if(r==100) {
							if( typeof(callback)!='undefined' ) return callback();
							else return;
						}
					});
				});
			};
			// Call downloader:
			traverse(this,
				function() {
					// Completed: make zip available for download
					$('#downloader_panel #progressbar').progressbar('value', 100);
					$('#downloader_panel').css('text-align', 'center');
					// Set background color of Flash object to match .ui-widget-content
					var bgclrp = $('.ui-widget-content').css('background-color').split(/',\s*'/);
					if(bgclrp.length>=3) {
						var clrh = new Array(3);
						for( var i=0;i<3;i++ ) {
							clrh[i]=parseInt(bgclrp[i].replace(/[^\d]/g,'')).toString(16);
							while( clrh[i].length<2 ) clrh="0"+clrh[i];
						}
						var color = parseInt(clrh.join(''), 16);
						$('#ichelper')[0].setBGColor(color);
					}
					$('#ichelper').css({visibility: 'visible', 'margin-top': '15px'});
					// TODO: Center button on panel
					$('#ichelper')[0].generateZip();
				}
			);

			/* // NOTE: downloader.php expects associative array as array[name] = href. Currently links array
			   // is of the form array[0] = [href, name]. Change back if reverting to downloader.php! (But try to find a way not to have to revert do server-side scripting!)
						$.post("http://localhost/IndexScraper/downloader.php?overwrite="+overwrite+"&name="+name,
				   {'links': links},
				   function(data) { alert("Response: "+data); });
				   */
			
			return null;
		};
		
	
		$.fn.makeLinksAbsolute = function(baseurl) {
			// Make all links contained in this absolute with given baseurl
			// VESTIGIAL? REMOVE?
			if( !/\/$/.test(baseurl) ) {
				// If baseurl does not end in a slash, it might be a document,
				// not a directory. Make sure it is a directory.
				if( /\?/.test(baseurl) || !/\/.+\.[\w\d_\-]+$/.test(baseurl) )
					baseurl = baseurl.split('?')[0].split('/').slice(0,-1).join('/');
				baseurl += '/';
			}
			this.find('a').each(function(i, me) {
				var href = $(me).attr('href');
				if( !/^https?:\/\//i.test(href) ) {
					// Only update non-absolute links (obviously)
					if( /^\//.test(href) ) href = href.substr(1,href.length);
					$(me).attr('href', baseurl + href);
				}
			});
			return this;
		};
		
		
		$.fn.filterLinks = function(tags) {
			// For filtering a list according to given filter tags.
			// this = the list of links to be filtered.
			var filter_tags = new Array(0);
			$(tags).each(function(i, me) {
				raw_text = me.innerHTML.replace(/&nbsp;/g, " ").replace(/^\s+|\s+$/g, '');
				filter_tags.push(new FilterTag(raw_text));
			});
			
			this.find('a').each(function(i, me) {
				for( var i=0; i<filter_tags.length; i++ ) {
					if( filter_tags[i].matches(me) ) {
						// tag was found, so remove parent (which will be something like <li/>)
						$(me.parentNode).remove();
						break;
					}
				}
			});
			return this;
		};
		
	
		$.fn.getSelectedElement = function() {
			// Get selected element in given window.
			// Call on a window wrapped in a jQuery object.
			// Returns selected elemented, which means this method is NOT CHAINABLE!
			var e = null;
			try {
				e = this[0].getSelection().getRangeAt(0).commonAncestorContainer;
				while( e.nodeType!=1 ) e = e.parentNode;
			} catch( ex ) { // nothing selected
				e = document.body;
			}
			return e;
		};
	
	
		$.fn.getPath = function(doGuessList) {
			// Modified slightly from http://paste.blixt.org/297640
			// (There were some issues with eq vs. nth-child.)
			//
			// Also, pass boolean in order to tell the function to guess what the
			// path of the list is (default is false).
			var ret = '';
			if (this.length != 1) throw 'Requires one element.';
		
			if( typeof(doGuessList)=='undefined' ) doGuessList=false;
		
			var path, node = this;
			while (node.length) {
				var realNode = node[0], name = realNode.localName;
				if (!name) break;
		
				name = name.toLowerCase();
				if (realNode.id) {
					// As soon as an id is found, there's no need to specify more.
					ret = name + '#' + realNode.id + (path ? '>' + path : '');
					break;
				} else if (realNode.className) {
					name += '.' + realNode.className.split(/\s+/).join('.');
				}
		
				var parent = node.parent(), siblings = parent.children(name);
				if (siblings.length > 1) {
					var ap = 'eq';
					var i = 0;
					switch( name ) {
						case 'div':
							ap = 'eq';
							i = siblings.index(node);
							break;
						default:
							ap = 'nth-child';
							i = siblings.index(node)+1;
							break;
					}
					name += ':' + ap + '(' + i + ')';
				}
				path = name + (path ? '>' + path : '');
		
				node = parent;
			}
			if( ret.length==0 ) ret = path;
			// Note: .closest('body') is used in lieu of a document, since this method
			// is likely called on an element, not a selector (and so the context will
			// just be the element, not a document). Alternatively, the top-level
			// selector (or perhaps its parent) could be passed as context, which might
			// be a little quicker.
			return (doGuessList)? guessList(ret, this.closest('body')) : ret;
		};
	
	
		$.fn.displayList = function(list, listItemTag) {
			// For populating an element with a list, the items
			// of which are marked up with listItemTag. listItemTag defaults
			// to <li/> if none is given.
			if( typeof(listItemTag)=='undefined') listItemTag='li';
			this.empty();
			for( var i=0; i<list.length; i++ ) {
				var new_item = document.createElement(listItemTag);
				new_item.appendChild(list[i]);
				this.append(new_item);
			}
			return this;
		};
		
		
		$.fn.explodePattern = function() {
			// For reading a URL pattern in a textbox. Something like
			// "A-Z,0-9" will return [A,B,C,...,Z,0,1,2,...,9]. Delimit by commas, range using hyphen.
			// Currently supported ranges are simple alphanumeric. More to come on an as-needed basis.
			// Returns array.
			var list = new Array();
			var s = this.val();
			var t = s.split(/,/);
			var ranges = {
				alpha_l : "abcdefghijklmnopqrstuvwxyz",
				alpha_u : "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
				num 	: "0123456789"
			};
			for( var i in t ) {
				if(/\-/.test(t[i])) {
					// range
					var chunks = t[i].split(/\-/);
					if( chunks.length != 2 ) return false;
					var start = chunks[0], end = chunks[1];
					for( var x in ranges ) {
						if( RegExp(start).test(ranges[x]) && RegExp(end).test(ranges[x]) ) {
							// Todo: more complicated ranges might need to split at other character
							range = ranges[x].split('');
							for( var j=ranges[x].indexOf(start); j<=ranges[x].indexOf(end); j++ )
								list.push(range[j]);
							break;
						}
					}
				}else{
					// literal
					list.push(t[i]);
				}
			}
			return list;
		};
		

		/* ********* *\
		 * Functions *
		\* ********* */
		// : Functions which use jQuery but are not plugins per se.
		// : Set anonymous functions to globals.
		window.guessList = function(path, doc) {
			// Take a unique CSS selector and try to determine
			// the selector for a list of like elements in the DOM.
			// Do this by maximizing the length of the selection when a child-specifying
			// delimiter is removed from the selector. For example, if the given path is:
			// 'table>tbody>tr:nth-child(4)>td:nth-child(1)'
			// then the maximization will probably occur when the :nth-child delimeter is
			// removed from the `tr` selector.
			// This method is not guaranteed to find the correct path, but it is often right
			// and is worth trying. Things to look out for / heuristics to account for
			// in the future: classes for alternating colors in table rows.
			if( typeof(doc)=='undefined' ) doc = document;
			var parts = path.split('>');
			var cur_longest_path = path, cur_longest_length = 0;
			for( var i=parts.length; i>0; ) {
				if( parts[--i].indexOf(':nth-child')>-1 || parts[i].indexOf(':eq')>-1 ) {
					var _tmpPart = parts[i];
					var newpart = parts[i].split(':')[0];
					parts[i] = newpart;
					newpath = parts.join('>');
					var _sel = $(newpath, doc);
					if( _sel.length > cur_longest_length ) {
						cur_longest_path = newpath;
						cur_longest_length = _sel.length;
					}
					// Make sure parts array is set back to normal
					parts[i] = _tmpPart;
				}
			}
			return cur_longest_path;
		};
		/// End functions
		
	})( jqlib ); // Install the above in given jQuery object
	
	
	
	// jQuery Extensions
	// Extend object with [':'] expression regex. Courtesy of James Padolsey.
	jqlib.extend(jqlib.expr[':'], {
		regex : function(elem, index, match) {
    		var matchParams = match[3].split(','),
        		validLabels = /^(data|css):/,
        		attr = {
            		method: matchParams[0].match(validLabels) ? 
                        	matchParams[0].split(':')[0] : 'attr',
            		property: matchParams.shift().replace(validLabels,'')
        		},
        		regexFlags = 'ig',
        		regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    		return regex.test(jQuery(elem)[attr.method](attr.property));
		}
	});
	// End jQuery extensions
	
	
};


function fromAS(obj) {
	// Just in case communication from AS becomes necessary
	return;
}

// Set loaded global, so Bookmarklet knows.
window.indexScraperLoaded = true;
