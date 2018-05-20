# CondiLoader
### Asynchronous conditional javascript and CSS loader

This script is intended to do non-blocking conditional JavaScript and CSS loading on web page.
It takes array of items and for each item checks, whether element with specified selector or xpath presents on the page.
If it does, then script loads specified CSS ana JavaScript, calls init function or triggers event with specifiend name.
This allows to list all your JavaScripts and CSS of the site in one place, but load only those, which current page really needs.

#### Usage:
There are two ways to use script. The first is to add following code to your HTML:
```HTML
<script>
function CondiLoaderInit() {
  new CondiLoader([
// item1,
// item2, e.g.:
// { sel: ".carousel", // if element with class carousel present on the page, item will be processed
//   js: ["jquery.js","jquery.carousel.js"], // loading jQuery and jQuery carousel plugin
//   css: "carousel.css",  // loading styles for carousel
//   init: ()=>jQuery('.carousel').carousel(), // init function, which will be called after all files are loaded
//   event: "CarouselLoaded", // event to be triggered after all files will be loaded
//   name: "Carousel block" // human-readable name of the block to make debugging easier
// }
  ],{ /* options */ });
}
</script>
<script src="condi_loader.js" onload="CondiLoaderInit()" defer="defer"></script>
```

The second is to move the contens of CondiLoaderInit function to separate file (e.g. condi_loader_init.js):
```HTML
<script src="condi_loader.js" defer="defer"></script>
<script src="condi_loader_init.js" defer="defer"></script>
```

#### Item parameters
Each item object in items array can contain following properties:
 *   sel — CSS selector to element. If no elements found, item will not be processed
 *   xpath — xpath expression for element. If no elements found, item will not be processed.
 *   css — CSS file(s) to load. Can be string with single file name or array of file names.
 *   media — media attribute for CSS tags.
 *   js — JavaScript file(s) to load. Can be string with single file name or array of file names. Files are loaded in order specified.
 *   init — function to call after all CSS and JavaScript files of item are loaded
 *   event — name of event to fire after CSS and JavaScript files of item are loaded. This is useful for inline JavaScript code which depends on externals scripts. Just convert it to custom event listener.
 *   name — name of item block (useful for debugging messages)

All parameters are not mandatory.
If both sel and xpath specified, block will be processed when both sel AND xpath elements found.
If neither sel nor xpath specified, item will be processed always, without any condition checking.
All items are processed in parallel. If it is unable to load JS or CSS, init function call and event firing are skipped and error message output to console.

#### Supported options:
 *   baseCSS — path to prepend to all relative CSS URLs. Default is empty string.
 *   baseJS — path to prepend to all relative JavaScript URLs. Default is empty string.
 *   skipDoubleLoad — when true, CondiLoader checks if script with same URL is loading by other item and will not load same script twice. Default is true.

For working example see example.htm file.

You can create as many CondiLoader instances as you need, but keep in mind that JavaScript double loading check works only within same instance.

