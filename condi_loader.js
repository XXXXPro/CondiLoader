/** ===========================================
 * Conditional asyncronous loader script, version 0.90
 *  *
 * Written by 4X_Pro (http://4xpro.ru), 2018
 *
 * Distributed under MIT license
 *
 * This script is intended to do asynchronous conditional javascript and CSS loading on web page.
 * It takes array of items and for each item checks, whether element with specified selector or xpath presents on the page.
 * If it does, then script loads specified CSS ana JavaScript, calls init function or triggers event with specifiend name.
 * This allows to list all used JavaScripts and CSS of the site in one place, but load only those, which current page really needs.
 *
 * Usage:
 * new CondiLoader(items,options);
 *
 * Each item object in items array can contain following properties:
 *   sel - CSS selector to element. If no elements found, item will not be processed
 *   xpath - xpath expression for element. If no elements found, item will not be processed.
 *   css - CSS file(s) to load. Can be string with single file name or array of file names.
 *   js - JavaScript file(s) to load. Can be string with single file name or array of file names. Files are loaded in order specified.
 *   init - function to call after all CSS and JavaScript files of item are loaded
 *   event - name of event to fire after CSS and JavaScript files of item are loaded
 *   name - name of item block (useful for debugging messages)
 * All parameters are not mandatory.
 * If both sel and xpath specified, block will be processed when both sel AND xpath elements found.
 * If neither sel nor xpath specified, item will be processed always, without any condition checking.
 * All items are processed in parallel. If it is unable to load JS or CSS, init function call and event firing are skipped and error message output to console. *
 *
 * Supported options:
 *   baseCSS - path to prepend to all relative CSS URLs. Default is empty string.
 *   baseJS - path to prepend to all relative JavaScript URLs. Default is empty string.
 *   skipDoubleLoad - when true, CondiLoader checks if script with same URL is loading by other item and will not load same script twice. Default is true.
 *
 * You can create as many CondiLoader instances as you need, but keep in mind that JavaScript double loading check works only within same instance.
 *
 * ============================================ **/

 'use strict';

try {
  var CondiLoader = function(items,options) {
    self = this;
    if (options===undefined) options={};
    options.baseCSS = (options.baseCSS!==undefined) ? options.baseCSS : ''; // base path to prepend to CSS URLs
    options.baseJS = (options.baseJS!==undefined) ? options.baseJS : ''; // base path to prepend to JavaScript URLs
    options.skipDoubleLoad = (options.skipDoubleLoad!==undefined) ? options.skipDoubleLoad : true; // if true, loader will check if javascript is already loaded and will not load it again.
    this.loading_js = []; // array to store promises for JS

    /** Checks, if URL is absolute **/
    this.is_abs_url = function (url) {
      return url.indexOf('//')===0 || url.indexOf('://')!==-1; // URL is absolute if it starts with // or contains something like http:// or https://
    }

    /**
     * Loading CSS with promise. If URL is relative, it will be prepended with options.baseCSS path
     ***/
    this.load_css = function (url,media) {
      var css_prom = new Promise(function (resolve,reject) {
        var el = document.createElement('link');
        el.rel='preload'; // for loading CSS async
        el.as='style';
        if (!self.is_abs_url(url)) url=options.baseCSS+url;
        el.href=url; // if URL is relative, adding baseCSS path
        if (media!=undefined) el.media=media;
        el.onload = function() {
          el.rel='stylesheet';
          resolve();
        }
        el.onerror = function (e) {
          reject('Error loading CSS: '+url);
        }
        document.head.appendChild(el);
      });
      return css_prom;
    }

    /**
     * Loading JS asynchronously with promise. If URL is relative, it will be prepended with options.baseJS path
     * If options.skipDoubleLoad is true, and url matches one of requested before, existing promise will be returned
     ***/
    this.load_js = function (url) {
      if (options.skipDoubleLoad && self.loading_js[url]!==undefined) return self.loading_js[url]; // if prevention of double load enadbled and script is already loading, return existing promise
      var js_prom = new Promise(function (resolve,reject) {
        var el = document.createElement('script');
        var full_url = url;
        if (!self.is_abs_url(url)) full_url=options.baseJS+url; // if URL is relative, adding baseJS path
        el.src=full_url;
        el.async=true;
        el.onload=function() {
          resolve();
        }
        el.onerror = function(e) {
          reject('Error loading JS: '+url);
        }
        document.head.appendChild(el);
      });
      if (options.skipDoubleLoad) self.loading_js[url] = js_prom; // if prevention of double load enadbled, store promise in cache
      return js_prom;
    }

    /** This function checks, should be item processed or not.
     * This depends on selector or xpath specified in item. If there none of them on the page, item will be skipped.
     * If neither selector nor xpath specified, item will be processed.
     * TODO: add device type checks (desktop, mobile, tablet)
     ** */
    this.need_load = function (item) {
      var result = true; // by default, item will be loaded
      if (item.sel!==undefined) { // if selector specified, checking whether such elements present on the page
        if (typeof(item.sel)==="string") item.sel = new Array(item.sel);
        for (var i=0; i<item.sel.length; i++) result = result && (document.querySelectorAll(item.sel[i]).length>0); // check elements with selector
      }
      if (item.xpath!==undefined) { // if xpath specified, checking whether such elements present on the page
        if (typeof(item.xpath)==="string") item.xpath = new Array(item.xpath);
        for (var i=0; i<item.xpath.length; i++) result = result && (document.querySelectorAll(item.xpath[i]).length>0); // check elements with selector
      }
      return result;
    }

    /** This function do all job for single item: calls checking of selector or xpath condition, loads css and js, calls init function and fires custom event
     * **/
    this.load_item = function (item) {
        if (self.need_load(item)) {
          var prom = Promise.resolve();
          if (typeof(item.css)==="string") item.css = new Array(item.css);
          if (item.css!==undefined) for (var i=0; i<item.css.length; i++) prom.then(prom=self.load_css(item.css[i])); // loading CSS
          if (typeof(item.js)==="string") item.js = new Array(item.js);
          if (item.js!==undefined) for (var i=0; i<item.js.length; i++) prom.then(prom=self.load_js(item.js[i])); // loading JS
          if (typeof(item.init)==="function") prom.then(item.init); // calling init function, if everything was loaded correctly
          if (item.event!==undefined) prom.then(function () { document.dispatchEvent(new CustomEvent(item.event)); }); // calling custom event, if requested
          prom.catch(function (e) {
            console.log('Item '+item.name+' processing error! '+e);
          });
        }
    }

    /** Main working function, which calls load_item function for each item in items array
    * **/
    this.process = function() {
      items.forEach(function (item,idx) {
        item.name=item.name || 'Unnamed item #'+idx;
        self.load_item(item);
      });
    }

    document.addEventListener('DOMContentLoaded',this.process);
    if (document.readyState==='complete') this.process(); // if script loaded after DOMContentLoaded event
  }
}
catch (e) {
  console.log('CondiLoader general exception!', e);
}
