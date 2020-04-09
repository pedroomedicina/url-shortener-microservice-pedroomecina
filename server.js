'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

const bodyParser = require('body-parser')
const multer = require('multer'); // v1.0.5
const upload = multer(); // for parsing multipart/form-data
const dns = require('dns');

var app = express();

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded()) // for parsing application/x-www-form-urlencoded

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI);

var uriSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
});

var Uri = mongoose.model('Uri', uriSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", upload.array(), function (req, res) {
    const nuxt = async() => {
      try{
        let uri = await Uri.findOne({original_url: req.body.url})
        
        if (uri){
          return res.send(uri)
        }
        
        const uriCount = await Uri.countDocuments()

        uri = new Uri({
          original_url: req.body.url,
            short_url: uriCount+1
        })
        
        await uri.save()
        res.send(uri)
      }catch(e){
        res.status(400).send(e)
      }
    }
  
    dns.lookup(req.body.url.replace('https://', '').replace('http://', ''), { all: true } ,(err, addresses) => {
      if (err){
        return res.send({"error":"invalid Hostname"})
      }
      
      nuxt()
    })
});

app.get("/api/shorturl/:url?", async function (req, res) {
  try{
    
    if (!req.params.url || req.params.url == 'undefined'){
      return res.status(400).send()
    }
    
    const uri = await Uri.findOne({short_url: req.params.url})
    
    if(!uri){
      return res.status(404).send()
    }
    
    res.redirect(uri.original_url)
    
  } catch(e){
      res.status(500).send()
  }
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});