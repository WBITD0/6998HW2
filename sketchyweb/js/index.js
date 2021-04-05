//import * as AWS from 'aws-sdk';
var apigClient = apigClientFactory.newClient();
var albumBucketName = "photostorageyz3691";
var transcribeBucketName = "photostorageyz3691";
var bucketRegion = "us-east-1";
var IdentityPoolId = "us-east-1:9a59b266-caf4-4437-af30-35865db5210d";
var random_str_audio = Math.random().toString(36).slice(-6);
var progress = document.getElementById('progress');
var log = document.getElementById('log');
log.innerHTML = ""
progress.innerHTML = ""
AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
	IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName }
});

function showImage(src, width, height, alt) {
	var img = document.createElement("img");
	img.src = src;
	img.width = width;
	img.height = height;
	img.alt = alt;
};

var uploadButton = document.getElementById("file_upload");
uploadButton.addEventListener("click", uploadImage);
function uploadImage(){
	var files  = $("#file").prop('files')
	if (!files.length) {
		log.innerHTML = "No file chosen";
	}
	else{
		log.innerHTML = "";
	var file = files[0];
	var fileName = file.name;
	var albumPhotosKey = encodeURIComponent('Photo') + "/";
	var albumLabelsKey = encodeURIComponent('Label') + "/";
	
	var random_str = Math.random().toString(36).slice(-6)
	var photoKey = albumPhotosKey + fileName.split(".")[0] + '_' + random_str + '.' + fileName.split(".")[1];
	var labelKey = albumLabelsKey + fileName.split(".")[0] + '_' + random_str +  ".txt";
	// Use S3 ManagedUpload class as it supports multipart uploads
	if ($('#label').val()){
		console.log($('#label').val());
		var upload_label = new AWS.S3.ManagedUpload({
			params: {
			Bucket: albumBucketName,
			Key: labelKey,
			Body: $('#label').val()
			}
		});
		upload_label.promise();
	}
	else{
		var upload_label = new AWS.S3.ManagedUpload({
			params: {
			Bucket: albumBucketName,
			Key: labelKey,
			Body: " "
			}
		});
		upload_label.promise();
	}
	var upload = new AWS.S3.ManagedUpload({
		params: {
		  Bucket: albumBucketName,
		  Key: photoKey,
		  Body: file
		}
	});
	upload.promise();
	log.innerHTML = "upload complete!"
}
}
//var recorder, gumStream;
var recordButton = document.getElementById("recordButton");
recordButton.addEventListener("click", toggleRecording);
const stream = await navigator.mediaDevices.getUserMedia({
	audio: true,
	video: false
  });
const mimeType = 'audio/webm';
let chunks = [];
const recorder = new MediaRecorder(stream, { type: mimeType });
recorder.addEventListener('dataavailable', event => {
	if (typeof event.data === 'undefined') return;
	if (event.data.size === 0) return;
	chunks.push(event.data);
  });
recorder.addEventListener('stop', () => {
	console.log(chunks);
	const recording = new Blob(chunks, {
	  type: mimeType
	});
	console.log(recording)
	var random_key = Math.random().toString(36).slice(-6);
	var audioKey = 'Audio/' + 'test' + '.webm';
	//var audioKey = 'Audio/' + random_key + '.webm';
	var upload = new AWS.S3.ManagedUpload({
		params: {
		Bucket: albumBucketName,
		Key: audioKey,
		Body: recording
		}
	});
	upload.promise();
	chunks = [];
	var params = {q:audioKey+"/audio"};
	console.log(params);
	progress.innerHTML = "processing audio";
	apigClient.searchGet(params, {}, {})
	.then(function(result){
	//This is where you would put a success callback
	console.log(result);
	let textOutput = result.data;
	document.getElementById("searchText").value = textOutput;
	progress.innerHTML = ""
	});
  });
function toggleRecording() {
    if (recorder.state == "recording") {
        recorder.stop();
		recordButton.innerText = 'Start';
    } else {
		recorder.start();
		recordButton.innerText = 'Stop';
    }
}
$('#search').click(function(){
	var img_display = document.getElementById("show");
	img_display.innerHTML = "";
	var query = $('#searchText').val();
	var params = {q: query+"/text"};
	console.log(params);
	apigClient.searchGet(params, {}, {})
		.then(function(result){
			console.log("search finished");
			console.log(result);
		let imgs = result.data
		progress.innerHTML = `${imgs.length} images found`
		for (var i = 0; i < imgs.length; i++) {
			var img_url = imgs[i];
			var new_img = document.createElement('img');
			new_img.src = img_url;
			new_img.width = 500;
			img_display.appendChild(new_img);
		}
		
		});

});