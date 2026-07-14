document.addEventListener("DOMContentLoaded", function() {

	let localizeScript = document.createElement('script');
	localizeScript.src = "//global.localizecdn.com/localize.js";
	localizeScript.type="text/javascript";
	localizeScript.onload = function() {
	  !function(a){if(!a.Localize){a.Localize={};for(var e=["translate","untranslate","phrase","initialize","translatePage","setLanguage","getLanguage","getSourceLanguage","detectLanguage","getAvailableLanguages","untranslatePage","bootstrap","prefetch","on","off","hideWidget","showWidget"],t=0;t<e.length;t++)a.Localize[e[t]]=function(){}}}(window);
	
	  Localize.initialize({
	    key: '1DOZh9A4Hqlwq',
	    disableWidget: true,
	    rememberLanguage: true,
	    autoApprove: true,
	  });
	  
	  // Add capability to accept the 'lang' parameter from url.
	  const urlParams = new URLSearchParams(window.location.search);
    let lang = urlParams.get('lang');
    if (lang) {
    	// All language codes such as en-US, en-UK, and en will be treated as English. 
    	lang = lang.split('-');
      lang = lang[0];
 
      // Remove the 'lang' parameter from the url after reloaded the page.
      const url = new URL(window.location.href);
      url.searchParams.delete('lang');
      window.history.replaceState({}, '', url);
      
      // Update the current language.
      Localize.setLanguage(lang);
    }	  
	  
		Localize.on("setLanguage", function(data) {
	    // Update the current language label when switching language.
	    Localize.getAvailableLanguages(function(err, languages) {
	      if (err) return console.log(err);
	
	      var curLanguage = languages.find(o => o.code === data.to);
	      if (curLanguage) {
	        // Update the current language label on the desktop menu. 
	        document.getElementById("current_lang").innerHTML = curLanguage.name;
	
	        // Update the current language label on the mobile menu. 
	        $('.current_lang').text(curLanguage.name);
	        
	        // Close the mobile menu.
	        $('.utility-nav__translate').removeClass('dd-open');
	        $('.xs-lang-select-screen').removeClass('lang-select-active');
	        $('.mega-menu').removeClass('show-mega');
	        $('.overlay-menu').removeClass('shoverlay');
	        $('body').removeClass('body-no-scroll');
	      }
	    });
	  });
	  
	  Localize.getAvailableLanguages(function(err, languages) {
	  	// Move the English to the first one
	  	const enIndex = languages.findIndex(lang => lang.code === 'en');
			if (enIndex !== -1) {
		    const enItem = languages.splice(enIndex, 1)[0];
		    languages.unshift(enItem);
			}

	  	// Create a custom widget
			const customWidget = []
	 	  languages.forEach((language, index) => {
	 	  	customWidget.push('<a href="javascript:Localize.setLanguage(\'' + language.code + '\')">' + language.name + '</a>')
	 	  })
	 	  let customWidgetHtml = customWidget.join('')
	 	  customWidgetHtml = '<div class="localize-widget" notranslate>' + customWidgetHtml + '</div>'
	 	  
	 	  // Move the Localize widget to the desktop menu.
	 	  $('#localize-btn', $('.main-nav__wrapper')).html(customWidgetHtml);
	 	  
	 	  // Move the Localize widget to the mobile menu.
	 	  $('#localize-btn', $('.flyout-nav')).html(customWidgetHtml);
	 	  
		  // Display the language list item on the desktop menu.
		  $('#translate_item', $('.main-nav__wrapper')).addClass('translate-page');
			
		  // Display the language list item on the mobile menu.
		  $('#translate_item', $('.flyout-nav')).addClass('translate-page');
		  $('#localize-li-item').addClass('localize-li-active'); 	 
		})
			
	};
	document.body.appendChild(localizeScript);	
		
});
