var startButton = document.getElementById("start-button");

var urlParams = new URLSearchParams(window.location.search);

function generateString() {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

var isMeetingHost = false;
var meetingId = urlParams.get("meetingId");
var clientId = generateString();

const logger = new ChimeSDK.ConsoleLogger(
    "ChimeMeetingLogs",
    ChimeSDK.LogLevel.INFO
);
const deviceController = new ChimeSDK.DefaultDeviceController(logger);

let requestPath = `join?clientId=${clientId}`;
if (!meetingId) {
    isMeetingHost = true;
} else {
    requestPath += `&meetingId=${meetingId}`;
}

if (!isMeetingHost) {
    startButton.innerText = "Join!";
} else {
    startButton.innerText = "Start!";
}

startButton.style.display = "block";

async function start() {
    if (typeof meetingSession !== 'undefined' && meetingSession) {
        return
    }
    try {
        var response = await fetch(requestPath, {
            method: "POST",
            headers: new Headers(),
        });

        const data = await response.json();
        meetingId = data.Info.Meeting.Meeting.MeetingId;
        if (isMeetingHost) {
            document.getElementById("meeting-link").innerText = window.location.href + "?meetingId=" + meetingId;
        }
        const configuration = new ChimeSDK.MeetingSessionConfiguration(
            data.Info.Meeting.Meeting,
            data.Info.Attendee.Attendee
        );
        window.meetingSession = new ChimeSDK.DefaultMeetingSession(
            configuration,
            logger,
            deviceController
        );

        const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
        const videoInputs = await meetingSession.audioVideo.listVideoInputDevices();

        await meetingSession.audioVideo.chooseAudioInputDevice(
            audioInputs[0].deviceId
        );
        await meetingSession.audioVideo.chooseVideoInputDevice(
            videoInputs[0].deviceId
        );

        const observer = {
            videoTileDidUpdate: (tileState) => {
                console.log("VIDEO TILE DID UPDATE");
                console.log(tileState);
                if (!tileState.boundAttendeeId) {
                    return;
                }
                updateTiles(meetingSession);
            },
        };

        meetingSession.audioVideo.addObserver(observer);

        meetingSession.audioVideo.startLocalVideoTile();

        const audioOutputElement = document.getElementById("meeting-audio");
        meetingSession.audioVideo.bindAudioElement(audioOutputElement);
        meetingSession.audioVideo.start();
    } catch (err) {
        console.log(err)
    }
}

function updateTiles(meetingSession) {
    const tiles = meetingSession.audioVideo.getAllVideoTiles();
    console.log("tiles", tiles);
    tiles.forEach(tile => {
        let tileId = tile.tileState.tileId
        var videoElement = document.getElementById("video-" + tileId);

        if (!videoElement) {
            videoElement = document.createElement("video");
            videoElement.id = "video-" + tileId;
            document.getElementById("video-list").append(videoElement);
            meetingSession.audioVideo.bindVideoElement(
                tileId,
                videoElement
            );
        }
    })
}

window.addEventListener("DOMContentLoaded", () => {
    startButton.addEventListener("click", start);
});