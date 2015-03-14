'use strict';

var express = require('express'),
  app = express(),
  request = require('request'),
  path = require('path'),
  bluemix = require('./config/bluemix'),
  validator = require('validator'),
  VisualRecognition = require('./visual-recognition'),
  TextToSpeech = require('./text_to_speech'),
  extend = require('util')._extend,
  fs = require('fs');

// Bootstrap application settings
require('./config/express')(app);

// if bluemix credentials exists, then override local
var vrCredentials = extend({
  url: "",
  username: "",
  password: ""
}, bluemix.getServiceCreds('visual_recognition')); // VCAP_SERVICES
var tsCredentials = extend({
  url: "",
  username: "",
  password: ""
}, bluemix.getServiceCreds('text_to_speech'));

// Create the service wrappers
var visualRecognition = new VisualRecognition(vrCredentials);
var textToSpeech = new TextToSpeech(tsCredentials);

// render index page
app.get('/', function(req, res) {
  res.render('index');
});

// get audio provided speech text
app.get('/synthesize', function(req, res) {
  var transcript = textToSpeech.synthesize(req.query);

  transcript.on('response', function(response) {
    response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
  });
  transcript.pipe(res);
});

app.post('/',function(req, res) {
  var classifier = JSON.stringify({label_groups: [ 'Activity Facility',
     'Adult',
     'Adventure Sport',
     'Air Sport',
     'Air Vehicle',
     'Airplane',
     'Animal',
     'Animal Sport',
     'Animals (facet)',
     'Appliance',
     'Arthropod',
     'Athletic Facility',
     'Baseball',
     'Bat Sport',
     'Bike',
     'Bird',
     'Boat',
     'Boating',
     'Car',
     'City Scene',
     'Classroom',
     'Club Sport',
     'Combat Sport',
     'Diving',
     'Even-Toed Ungulate',
     'Face',
     'Field',
     'Fishing',
     'Food',
     'Food (facet)',
     'Football',
     'Forest',
     'Group of People',
     'Horse Sport',
     'Human',
     'Human View (facet)',
     'Ice Scene',
     'Ice Skating',
     'Ice Sport',
     'Indoors',
     'Industrial Scene',
     'Insect',
     'Invertebrate',
     'Land Vehicle',
     'Landmark',
     'Landmarks (facet)',
     'Leisure Activity',
     'Mammal',
     'Man-Made Scene',
     'Marsupial',
     'Meat-Eater',
     'Motor Sport',
     'Mountain Scene',
     'Music Instrument',
     'Nature Scene',
     'Outdoors',
     'People (facet)',
     'Person',
     'Person View',
     'Placental Mammal',
     'Power Boating',
     'Racquet Sport',
     'Religious Establishment',
     'Reptile',
     'Room',
     'Rowing',
     'Rural Scene',
     'Scene',
     'Scenes (facet)',
     'Ship',
     'Skiing',
     'Skyline',
     'Sledding',
     'Snow Sport',
     'Sports',
     'Sports (facet)',
     'Stick Sport',
     'Street Scene',
     'Surface Water Sport',
     'Swimming',
     'Team Field Sport',
     'Team Indoor Sport',
     'Team Sport',
     'Tool',
     'Track and Field',
     'Truck',
     'Type (facet)',
     'Underwater Sport',
     'Urban Structure',
     'Vehicle',
     'Water Scene',
     'Water Sport',
     'Water Vehicle',
     'Whale, Dolphin or Porpoise',
     'Winter Scene',
     'Winter Sport',
     'Wrestling' ],});
  
  //console.log(req.files);
  var imgFile;
  var image = req.files['upload.jpeg']
  if (image) {
    imgFile = fs.createReadStream(image.path);
  } else {
    // malformed url
    return res.status(500).json({ error: 'Malformed URL' });
  }

  var formData = {
    labels_to_check: classifier,
    imgFile: imgFile
  };

  console.log(formData);

  visualRecognition.recognize(formData, function(err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: err });
    }
    else {
      return res.json(result);
    }
  });
});

app.get('/geo', function(req, res){
  var options = {
    rejectUnauthorized: false,
    url: '',
    qs: {
      appId: '',
      latitude: req.query.latitude,
      longitude: req.query.longitude,
      searchDistance: 500
    }
  };
  console.log('geo');
  request(options, function (error, response, body){
    console.log('inside callback');
    return res.json(body);
  });

});

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
