'use strict';
/*global $:false */

(function() {
  function humanizeString(string) {
      string = $.trim(string);
      var terms = string.split('_');

      for(var i=0; i < terms.length; i++){
          terms[i] = terms[i].charAt(0).toUpperCase() + terms[i].slice(1);
      }

      return terms.join(' ');
  }  
  function dataURItoBlob(dataURI) {
      // convert base64 to raw binary data held in a string
      // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
      var byteString = atob(dataURI.split(',')[1]);
      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);
      var dw = new DataView(ab);
      for(var i = 0; i < byteString.length; i++) {
          dw.setUint8(i, byteString.charCodeAt(i));
      }
      // write the ArrayBuffer to a blob, and you're done
      return new Blob([ab], {type: mimeString});
  }        

  var streaming = false,
      video        = document.querySelector('#video'),
      canvas       = document.querySelector('#canvas'),
      photo        = document.querySelector('#photo'),
      imagefield = document.querySelector('#file'),
      form = document.querySelector('#fileupload'),
      width = 320,
      height = 0;

  navigator.getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

  navigator.getMedia(
    {
      video: true,
      audio: false
    },
    function(stream) {
      if (navigator.mozGetUserMedia) {
        video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        video.src = vendorURL.createObjectURL(stream);
      }
      video.play();
    },
    function(err) {
      console.log("An error occured! " + err);
    }
  );

  ion.sound({
      sounds: [
          {name: "camera_flashing_2"}
      ],
      path: "sounds/",
      preload: true,
      volume: .9
  });

  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth/width);
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  function initialAudio(){
    var str = 'Please direct camera forward and tap the screen to recieve guidence';
    var audio = $('.audio').get(0);
    audio.setAttribute('src','/synthesize?text=' + str);
  }

  initialAudio();

  function showMap(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    $.ajax({
      url: '/geo',
      data: {
        latitude: latitude,
        longitude: longitude
      },
      success: function(data){
        console.log(data);
        var addressStringResult = JSON.parse(data)["Output"]["Result"][0];
        var addressString = addressStringResult["AddressLine1"];
        var side = addressStringResult["StreetSide"];
        addressString = "You are near " + addressString;
        if(side){
          if(side === "L") {
            addressString += " on the left";
          }
          if(side === "R") {
            addressString += " on the right";
          }
          addressString += " side of the street."
        }

        var audio = $('.audio').get(0);
        audio.setAttribute('src','/synthesize?text=' + addressString);       
      },
    });
  }

  //navigator.geolocation.getCurrentPosition(showMap);

  function displayResults(results) {
    var image = JSON.parse(results).images[0];
    var htmlString = '<div id="js-results" class="result"><ul>';
    var speechString = '';
    var labels = image.labels;
    labels.slice(0, 5).forEach(function(label) {
      htmlString += '<li>' + humanizeString(label.label_name) + '</li>';
      speechString += humanizeString(label.label_name) + ' ';
    });
    htmlString += '</ul></div>';
    $('#js-results').replaceWith(htmlString);
    // Ask for voice;
    var audio = $('.audio').get(0);
    audio.setAttribute('src','/synthesize?text=' + speechString);
    setTimeout(function(){ navigator.geolocation.getCurrentPosition(showMap); }, 10000);
    
  }

  function takepicture() {
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    ion.sound.play("camera_flashing_2");
    var data = canvas.toDataURL('image/jpeg');
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    var dataURI = data;
    var blob = dataURItoBlob(dataURI);
    formData.append('upload.jpeg', blob);
    xhr.open('POST', '/', true);
    xhr.onload = function(e) {
        console.log(e);
        console.log('loaded');
        console.log(xhr.response);
        displayResults(xhr.response);
    };
    xhr.send(formData);
  }

  video.addEventListener('click', function(ev){
    takepicture();
    ev.preventDefault();
  }, false);
})();