/**
 * ContactUs Form class
 * @author jegj
 */
var ContactUsForm = {	};

ContactUsForm.checkFormFocus = function _checkFormFocus() {
	return $(window).scrollTop() >= $('#contact').position().top;
}


ContactUsForm.init = function _init(){
	window.addEventListener('scroll', function(){
		if ( ContactUsForm.checkFormFocus() ) {
			console.log('here');
		}
	});
}

document.addEventListener("DOMContentLoaded", function(){
	ContactUsForm.init();
});
