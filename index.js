function statusChangeCallback(response) {
    console.log(response);
    alert(response);
}

window.fbAsyncInit = function () {
    FB.init({
        appId: '1223307077695278',
        cookie: true,
        xfbml: false,
        version: 'v2.4'
    });

    FB.getLoginStatus(function (response) {
        onLoginStatusChange(response);
    })
};

(function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "http://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
 }(document, 'script', 'facebook-jssdk'));