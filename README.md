# Asset-warmer

> This package helps to show percentage loader for 
SPA websites while loading core assets.
>
> Websites build on frameworks like Angular or Vue tend to have 
pretty big javascript or even css files.
>
> When creating SPA website in most cases we want to show 
loading screen and when assets (main js/css files) are downloaded
we showing our entire web app.
>
> This package helps You to show you progress (%), what kind of file
now its downloading etc. and make loading screen more lively.
>
> Its really helpful for visitors with slow internet connection 
because they will see real progress of site being loading for sure.


### Requirements

* `required` Assets must be in the server where CORS enabled (You must be able to make ajax request to it). (localhost works, most of cdn also).
* `optional` Server should return `Content-Length` header of assets for better warmer experience. If You unable to use it, You will be able to write asset size manualy or use progress events without total size (percentage).

### Install

`npm install asset-warmer --save-dev`

### Usage

It would be best if you would copy `node_modules/asset-warmer/asset-warmer.min.js` file in your public folder and add reference to it by script tag:

	<body>
		...
		<script src="asset-loader.min.js"/>
		<script>
		 new Warmer(['jquery.min.js', 'app.js']);
		</script>
	</body>
	
But you can use `require` of course.

	const Warmer = require('asset-warmer');
	new Warmer(['vendors.js', 'extenstions.js', 'app.js']).on('update', e => {});
	
Just keep in mind that adding this package to your main javascript bundle doesnt make sense.

You need to make another small bundle with asset warmer add it to your index.html file and remove all other assets from it. (leave them only in warmer array - it will be downloaded and appended).  	

#### Initialization

If you want to warm-up single file just run:

    var warmer = new Warmer('app.js');
    
    
You can also pass array of files:

    var warmer = new Warmer(['app.js', 'app.css', 'images/logo.png']);
    
If you will be showing which file is warming up, you can also pass files as
objects with custom names:

    var warmer = new Warmer({src: 'app.js', name: 'Core website'});
    
You can also pass objects in arrays, even mix them together when just strings of filepath.

    var warmer = new Warmer([
        {src: 'app.js', name: 'Core website'},
        'images/logo.png',
        {src: 'app.css', name: 'Stylings'}
    ]);

File object requires only `src` parameter, if `name` is missing, system will
create one from `src`. You can also pass `size` to set filesize in bytes, if package will 
not be able to retrieve it from server.


#### Events

Update event, shows entire progress of assets.

    var warmer = new Warmer('app.js');
    warmer.on('update', function(e) {
      console.log(e.type); //asset_progress, asset_loaded, asset_failed,  
      console.log(e.file.name);  
      console.log(e.file.src);  
      console.log(e.file.percentage);  
      console.log(e.file.loaded);  
      console.log(e.file.total);  
      console.log(e.file.knownSize);  
      console.log(e.progress.bytes.loaded);  
      console.log(e.progress.bytes.total);  
      console.log(e.progress.bytes.percentage);  
      console.log(e.progress.files.loaded);  
      console.log(e.progress.files.loading);  
      console.log(e.progress.files.total);  
      console.log(e.progress.files.percentage);  
      console.log(e.result);  
      console.log(e.event);  
      console.log(e.errorType);  
    });
    
After all assets loaded, warmer will fire `finished` event.

    warmer.on('finished', function(e) {
        //e contains array of files
    });
    
Warmer also fires `asset_appended` and `appended` (for all) after assets are 
appended to DOM.


#### Options

You can pass options to second parameter of Warmer function.
 By using options you can disable default behaviour such as auto asset appending to DOM.
 
 
    var options = {
        appendWhenDone: false
    };
    var warmer = new Warmer('app.js', options);



| Options  | Description |
| ------------- | ------------- |
| appendWhenDone  | Automatically append js/css assets to dom `head` 						tag after ALL of assets are retrieved. Default is 						`true`  |
| appendAtOnce`*`  | Automatically append js/css assets to dom `head` 						tag at once when asset is retrieved. Default is 						`false`  |
| appendStyles  | Automatically append css assets to dom tag. 					Default is `true`. `appendWhenDone` or 					`appendAtOnce` must be true.  |
| appendScripts  | Automatically append js assets to dom tag. 						Default is `true`. `appendWhenDone` or 						`appendAtOnce` must be true. |
|byOrder`*`|Retrieves and appends assets in order given. Default `true`|

Options marked with `*` are non existing features in current version.

### How it works?

* You pass array of assets to warmer in order needed.
* Warmer one by one will retrieve assets needed and load it to browsers memory. 
* Warmer will send `update` event every time it will download some of asset.
* You can use event to change loading screen as you like with got data.
* When all assets retrieved, and there is css or js files in them - warmer will append them to the end of documents `head` tag.