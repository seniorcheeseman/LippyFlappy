const LippyFlappy = require('./audioLevels');

var PCM = []
var mouthArrayPerFrame;
var rmsList;
var audioFileStuff;
var closedMouthFile;
var halfOpenMouthFile;
var fullMouthFile;
var duration = 0
var canvas = document.getElementById('myChart')
var ctx = canvas.getContext("2d");

var myChart;

const runAudioLevelsBtn = document.getElementById('runAudioLevels');
runAudioLevelsBtn.addEventListener('click', runAudioLevels);

var horizonalLinePlugin = {
    id: 'horizontalLine',
    afterDraw: function(chartInstance) {
    var yScale = chartInstance.scales["y"];
    var index;
    var line;
    var style;

    if (chartInstance.options.horizontalLine) {
      for (index = 0; index < chartInstance.options.horizontalLine.length; index++) {
        line = chartInstance.options.horizontalLine[index];

        if (!line.style) {
          style = "rgba(169,169,169, .6)";
        } else {
          style = line.style;
        }

        if (line.y) {
          yValue = yScale.getPixelForValue(line.y);
        } else {
          yValue = 0;
        }

        ctx.lineWidth = 3;

        if (yValue) {
          ctx.beginPath();
          ctx.moveTo(0, yValue);
          ctx.lineTo(canvas.width, yValue);
          ctx.strokeStyle = style;
          ctx.stroke();
        }

        if (line.text) {
          ctx.fillStyle = style;
          ctx.fillText(line.text, 0, yValue + ctx.lineWidth);
        }
      }
      return;
    }
  }
};

Chart.register(horizonalLinePlugin);

function changeHandler({
  target
}) {
  // Make sure we have files to use
  if (!target.files.length) return;

  try {
      window.AudioContext = window.AudioContext ||
          window.webkitAudioContext ||
          window.mozAudioContext ||
          window.oAudioContext ||
          window.msAudioContext;

      var ctx = new AudioContext();

      // Create a blob that we can use as an src for our audio element
      const urlObj = URL.createObjectURL(target.files[0]);
      audioFileStuff = target.files[0]
      var request = new XMLHttpRequest();
      request.open('GET', urlObj, true);
      request.responseType = 'arraybuffer';
      request.onload = function() {
        let audioData = request.response;
        ctx.decodeAudioData(audioData, function(buffer) {
          PCM = buffer
          duration = buffer.duration;
          runAudioLevels()
        },
        function(e){"Error with decoding audio data" + e.error});   
      }
      request.send();

  } catch (e) {
      alert("Web Audio API is not supported by this browser\n ... http://caniuse.com/#feat=audio-api");
  }
}

function setClosed({
  target
}) {
  if (!target.files.length) return;
  closedMouthFile = target.files[0];
}
function setHalf({
  target
}) {
  if (!target.files.length) return;
  halfOpenMouthFile = target.files[0];
}
function setFull({
  target
}) {
  if (!target.files.length) return;
  fullMouthFile = target.files[0];
}

var audioUpload = document.getElementById("audio-upload")
audioUpload.addEventListener("change", changeHandler);
var closedUpload = document.getElementById("closed-upload")
closedUpload.addEventListener("change", setClosed);
var halfUpload = document.getElementById("half-upload")
halfUpload.addEventListener("change", setHalf);
var fullUpload = document.getElementById("full-upload")
fullUpload.addEventListener("change", setFull);

const lowLevelInput = document.getElementById('lowLevel');
const midLevelInput = document.getElementById('midLevel');
const fpsInput = document.getElementById('fpsSpeed');

async function image2video () {
  LippyFlappy.powerOfLippyFlappy(audioFileStuff, closedMouthFile, halfOpenMouthFile, fullMouthFile, mouthArrayPerFrame, fpsInput.value)
}

function runAudioLevels() {
  rmsList = LippyFlappy.getAudioLevelOutputPerFrame(PCM, duration, fpsInput.value);
  mouthArrayPerFrame = LippyFlappy.getMouthFlapsPerFrame(rmsList, lowLevelInput.value, midLevelInput.value)
  showGraph()
}

function showGraph() {
  if (myChart) {
    myChart.destroy();
  }
  var channelData = rmsList
  var labels = []
  for(var i = 0; i < channelData.length; i ++) {
    labels.push(i.toString())
  }
  const data = {
    labels: labels,
    datasets: [{
      label: 'Audio Levels',
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: channelData,
    }]
  };

  const config = {
    type: 'line',
    data: data,
    options: {
      "horizontalLine": [{
        "y": lowLevelInput.value,
        "style": "#87ceeb",
        "text": "lower-flap"
      }, {
        "y": midLevelInput.value,
        "style": "#87ceeb",
        "text": "full-flap"
      }],
    }
  };

  myChart = new Chart(
    document.getElementById('myChart'),
    config
  );
}

const elm = document.getElementById('start-btn');
elm.addEventListener('click', image2video);