const fs = require('fs');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');

const ffmpeg = createFFmpeg({ log: true });

var LippyFlappy = function(){};

LippyFlappy.powerOfLippyFlappy = async function(audioFileStuff, closedMouth, halfOpenMouth, fullMouth, mouthArrayPerFrame, fps) {
    const audioFile = await fetchFile(audioFileStuff)
    const closedMouthImg = await fetchFile(closedMouth)
    const halfMouthImg = await fetchFile(halfOpenMouth)
    const fullMouthImg = await fetchFile(fullMouth)

    const message = document.getElementById('message');
    const framesForVideo = mouthArrayPerFrame.length;
    var audioFileName = 'audio.mp3'
    message.innerHTML = 'Loading ffmpeg-core.js';
    console.log(audioFile)
    if(!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }
    message.innerHTML = 'Loading data';
    ffmpeg.FS('writeFile', audioFileName, audioFile);
    console.log('framesForVideo: ' + framesForVideo)
    for (let i = 0; i < framesForVideo; i += 1) {
        var mouth = mouthArrayPerFrame[i]
        const num = `${i}`;
        // console.log(mouth)
        // console.log(mouth === 0)
        if (mouth === 0) {
            ffmpeg.FS('writeFile', `tmp${num}.png`, closedMouthImg);
        }
        else if (mouth === 50) {
            ffmpeg.FS('writeFile', `tmp${num}.png`, halfMouthImg);
        }
        else {
            ffmpeg.FS('writeFile', `tmp${num}.png`, fullMouthImg);
        }
    }
    message.innerHTML = 'Start transcoding';
    await ffmpeg.run('-r', fps.toString(), '-pattern_type', 'glob', '-i', '*.png', 'out.mp4');
    //'-i', audioFileName,
    const data = ffmpeg.FS('readFile', 'out.mp4');
    
    const videoLipFlap = document.getElementById('output-video-LipFlap');
    videoLipFlap.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

    await ffmpeg.run('-r', fps.toString(), '-i', 'out.mp4', '-i', audioFileName, '-c:v', 'libx264', 'finalOut.mp4');

    ffmpeg.FS('unlink', audioFileName)
    for (let i = 0; i < framesForVideo; i += 1) {
        const num = `${i}`;
        ffmpeg.FS('unlink', `tmp${num}.png`);
    }

    const finalData = ffmpeg.FS('readFile', 'finalOut.mp4');
    
    const videoFinalLipFlap = document.getElementById('output-video');
    videoFinalLipFlap.src = URL.createObjectURL(new Blob([finalData.buffer], { type: 'video/mp4' }));
}

LippyFlappy.getAudioLevelOutputPerFrame = function(PCM, videoLength, fps) {
    var audioToFrames = Math.floor(videoLength * fps)
    var avgAudioBasedOffPCM = PCM.length/audioToFrames
    console.log('Actual Average frames of audio per video: ' + avgAudioBasedOffPCM)

    var framesForOneFrame = Math.ceil(avgAudioBasedOffPCM) // choose power of 2, 2048

    console.log('FPS: ' + fps)
    console.log('PCM length: ' + PCM.length)
    console.log("Video Length: " + videoLength)
    console.log("Audio in Video Frames: " + audioToFrames)
    console.log("Audio frames For One Frame: " + framesForOneFrame)

    var firstChannelAudio = PCM.getChannelData(0);
    var rmsList = []
    
    var audioFrameIdx = 0
    for (var i = 0; i < audioToFrames; i++) {
        var start = audioFrameIdx
        var end = Math.min(audioFrameIdx + framesForOneFrame, firstChannelAudio.length)
        var total = 0
        while (audioFrameIdx < end) {
            total += Math.abs(firstChannelAudio[audioFrameIdx++])
        }
        rms = (Math.sqrt(total / Math.max(end - start, 1)).toFixed(8) * 100.0)
        rmsList.push(rms)
    }

    console.log(PCM)
    return rmsList
}

LippyFlappy.getMouthFlapsPerFrame = function(rmsList, bottomThreshold, midThreshold) {
    var resultList = []
    var bottomLevel = bottomThreshold
    var midlevel = midThreshold 

    console.log("Inputed bottom level: " + bottomLevel)
    console.log("Inputed bottom level: " + midlevel)
    for(var i = 0; i < rmsList.length; i++) {
        var check = rmsList[i]

        // console.log("Checked amount: " + check)
        // console.log("IsBelow: " + (check < bottomLevel) + " isMid: " + (bottomLevel <= check && check < midlevel) + " isFull: " + (midlevel <= check))
        if (check < bottomLevel) {
            resultList.push(0)
        }
        else if (bottomLevel <= check && check < midlevel) {
            resultList.push(50)
        }
        else if (midlevel <= check) {
            resultList.push(100)
        }
    }
    console.log(resultList)
    return resultList
}


module.exports = LippyFlappy