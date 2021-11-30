from pydub import AudioSegment
from pydub.utils import get_array_type
import array


def getAudioOutput(inputMp3File, audioLevelInputFileName, bottomThreshold, midThreshold, fps):
    sound = AudioSegment.from_mp3(inputMp3File)

    # get raw audio data as a bytestring
    raw_data = sound.raw_data
    # get the frame rate
    sample_rate = sound.frame_rate
    # get amount of bytes contained in one sample
    sample_size = sound.sample_width

    bit_depth = sound.sample_width * 8
    array_type = get_array_type(bit_depth)

    

    framesForOneFrameNotRounded = 1/fps * sample_size * sample_rate
    framesForOneFrame = int(framesForOneFrameNotRounded)
    numeric_array = array.array(array_type, sound._data)

    length_of_frames = len(numeric_array)
    length_of_audio_file = sound.duration_seconds

    print("framerate: " + str(sample_rate))
    print("sample size: " + str(sample_size))
    print("size of array: " + str(length_of_frames))
    print("audio file length: " + str(length_of_audio_file))
    print('framesForOneFrame: ' + str(framesForOneFrame))
    
    startOfLastFrame = 0

    audioToFrames = int(length_of_audio_file * fps)

    bottomLevel = bottomThreshold
    midlevel = midThreshold
    
    print("audio frame number: " + str(audioToFrames))
    resultList = []
    for i in range(audioToFrames):

        end = min(startOfLastFrame + framesForOneFrame,length_of_frames)
        inputs = numeric_array[startOfLastFrame:end]
        maxAmount = max(inputs)
        minAmount = min(inputs)

        check = min(maxAmount, abs(minAmount))
        if(check < bottomLevel):
            resultList.append(0)
        elif(bottomLevel <= check < midlevel):
            resultList.append(50)
        elif( midlevel <= check):
            resultList.append(100)

        startOfLastFrame = startOfLastFrame + framesForOneFrame
    file=open(audioLevelInputFileName,'w')
    for items in resultList:
        file.writelines(str(items)+'\n')
    file.close()
