// webアプリ画面上のアクションを定義する
var startButton = document.getElementById("start-button");
var endButton = document.getElementById("end-button");
var lessons = document.getElementsByClassName("lesson");

// URLParamsの生成
var urlParams = new URLSearchParams(window.location.search);

// ランダムな文字列の生成
function generateString() {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

var isMeetingHost = false;
// URLパラメータからmeetingIDの取得
var meetingId = urlParams.get("meetingId");
// ランダムにclientIDの生成
var clientId = generateString();

const logger = new ChimeSDK.ConsoleLogger(
    "ChimeMeetingLogs",
    ChimeSDK.LogLevel.INFO
);
const deviceController = new ChimeSDK.DefaultDeviceController(logger);

// Hostがmeetingを開始したか否かの確認
let requestPath = `join?clientId=${clientId}`;
if (!meetingId) {
    isMeetingHost = true;
} else {
    requestPath += `&meetingId=${meetingId}`;
}

// Hostの開始状態に応じて、ボタンの表記を変更
if (!isMeetingHost) {
    startButton.innerText = "Join!";
} else {
    startButton.innerText = "Start!";
}

startButton.style.display = "block";

// 非同期でmeetingの開始
async function start() {
    if (typeof meetingSession !== 'undefined' && meetingSession) {
        return
    }
    try {
        // endButtonの表示
        endButton.style.display = "block";

        // FetchAPIのfetch()で非同期のネットワーク通信を記述
        var response = await fetch(requestPath, {
            method: "POST",
            headers: new Headers(),
        });

        // FetchAPIのresponseインタフェース。リクエストに対するレスポンスをjson形式で取得
        const data = await response.json();
        // 取得したレスポンスからmeetingIDを参照
        meetingId = data.Info.Meeting.Meeting.MeetingId;

        // meetingIDをクエリとして設定
        if (isMeetingHost) {
            document.getElementById("meeting-link").innerText = window.location.href + "?meetingId=" + meetingId;
        }
        // MeetingSessionに必要なconfigurationの設定
        const configuration = new ChimeSDK.MeetingSessionConfiguration(
            data.Info.Meeting.Meeting,
            data.Info.Attendee.Attendee
        );
        // MeetingSessionの設定
        window.meetingSession = new ChimeSDK.DefaultMeetingSession(
            configuration,
            logger,
            deviceController
        );
        
        const audioInputs = await meetingwSession.audioVideo.listAudioInputDevices();
        const videoInputs = await meetingSession.audioVideo.listVideoInputDevices();

        // Audio/Videoデバイスの指定
        await meetingSession.audioVideo.chooseAudioInputDevice(
            audioInputs[0].deviceId
        );
        await meetingSession.audioVideo.chooseVideoInputDevice(
            videoInputs[0].deviceId
        );

        // 
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

        // observerの追加
        meetingSession.audioVideo.addObserver(observer);

        // 指定したVideoデバイスを用いて、local videoの開始
        meetingSession.audioVideo.startLocalVideoTile();

        // Audio要素の取得とbind
        const audioOutputElement = document.getElementById("meeting-audio");
        meetingSession.audioVideo.bindAudioElement(audioOutputElement);

        // Meeting開始
        meetingSession.audioVideo.start();

    } catch (err) {
        console.log(err)
    }
}

// 非同期でmeetingの終了
function end(){
    try{
        // Meetingの終了
        meetingSession.audioVideo.stop();
    } catch (err){
        console.log(err);
    }
}

// VideoTileのアップデート
function updateTiles(meetingSession) {
    const tiles = meetingSession.audioVideo.getAllVideoTiles();
    console.log("tiles", tiles);
    tiles.forEach(tile => {
        let tileId = tile.tileState.tileId
        var videoElement = document.getElementById("video-" + tileId);

        // videoElementに値が入っているか否か
        if (!videoElement) {
            // 新規VideoTileの作成と追加
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

//ミーティング開始のイベントリスナー
window.addEventListener("DOMContentLoaded", () => {
    var date = new Date();
    var hour = date.getHours();
    var minute = date.getMinutes();
    // var time = hour+":"+minute;

    startButton.addEventListener("click", start);
    endButton.addEventListener("click", end);

    for(let i=0; i<lessons.length; i++){
        lessons[i].addEventListener("click", check);
    }

    // 時刻表示
    setInterval('dateTime()', 1000);

    // レッスンの表示
    let client_id = "shino123";
    queryClient(client_id);

    let lesson_id = "005";
    attachMeeitngID(lesson_id);

    // var temp = document.getElementById("time");
    // var stime = temp.innerText;
    // console.log(stime);
    // if(time==stime){
    //     start();
    // }
});

function check(){
    // window.alert("click");
    window.location.href = 'http://be3028.lomo.jp/DoSearch/';
}

function dateTime(){
    var today = document.getElementById("today");
    var date = new Date();
    var month = date.getMonth()+1;
    var week = date.getDay();
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();

    const dayOfTheWeek = new Array("月", "火", "水", "木", "金", "土", "日");

    today.innerText = month+"月"+day+"日"+"（"+dayOfTheWeek[week]+"）\n"+hour+"："+minute+"："+second;
}

// function printLesson(client_id){
//     const lesson_time = document.getElementById("time");
//     const lesson_title = document.getElementById("title");

//     const lessons = queryLesson(client_id);

//     lesson_time.innerText = "";
//     lesson_title.innerText = "";
// }

// DynamoDBの設定
AWS.config.update({
    region: "ap-northeast-1",
    //endpoint: "http://localhost:8000",
    endpoint: "https://dynamodb.ap-northeast-1.amazonaws.com/",
    // accessKeyId default can be used while using the downloadable version of DynamoDB. 
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    accessKeyId: "AKIAY35TMFPJ5HWLFGGW",
    // secretAccessKey default can be used while using the downloadable version of DynamoDB. 
    // For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    secretAccessKey: "i8WLVKSkopL8dmWqU/dMQxlAWHag05tm9mtm96PN"
})
const docClient = new AWS.DynamoDB.DocumentClient();

// MeetingIDとレッスンのリンク
function attachMeeitngID(lesson_id){

    let params = {
        TableName: "elmoTV_lesson",
        Key:{
            "Id": lesson_id
        },
        UpdateExpression: "set meetingId = :mid",
        ExpressionAttributeValues:{
            ":mid": meetingId
        },
        ReturnValues:"UPDATED_NEW"
    }

    docClient.update(params, function(data, err){
        if(err){
            console.log(err);
            console.log("meetingIDアップデート失敗！");
        }
        else{
            console.log(data);
            console.log("meetingIDアップデート成功！");
        }
    });
}

// クライアント情報の検索
function queryClient(client_id){
    let params = {
        TableName: "elmoTV_client",
        KeyConditionExpression: "#A = :a",
        ExpressionAttributeNames: {
            "#A": "Id"
        },
        ExpressionAttributeValues: {
            ":a": client_id
        }
    };

    docClient.query(params, function(err, data){
        if (err) {
            console.log(err);
            console.log("DB接続失敗!");
        } else {
            console.log(data);
            data.Items.forEach(item => {
                const lesson_id = item.lessonId.values;
                for(let i=0; i<lesson_id.length; i++){
                    queryLesson(lesson_id[i]);
                }
            })
        }
    })
}

// レッスンの検索と画面表示
function queryLesson(lesson_id){
    let params = {
        TableName: "elmoTV_lesson",
        KeyConditionExpression: "#A = :a",
        ExpressionAttributeNames: {
            "#A": "Id"
        },
        ExpressionAttributeValues: {
            ":a": lesson_id
        }
    }

    docClient.query(params, function(err, data){
        if(err){
            console.log(err);
            console.log("DB接続失敗!");
        }else{
            console.log(data);
            const parent = document.getElementById("lesson-item-wrapper");
            // forEachの変数はローカルスコープの範囲に留まる。
            data.Items.forEach(item => {
                const date = new Date();
                const week = date.getDay();
                const dayOfTheWeek = new Array("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
                const today = dayOfTheWeek[week];
                // console.log("dweek:"+item.dweek);
                // console.log("today:"+today);
                if(item.dweek == today) parent.appendChild(createItem(item));
            })
        }
    })
}

// レッスン項目の作成
function createItem(item){
    const e = document.createElement('div');
    e.className = "lesson-item";
    if(item){
        const timediv = document.createElement('div');
        timediv.id = "time";
        const namediv = document.createElement('div');
        namediv.id = "name";
        const instdiv = document.createElement('div');
        instdiv.id = "instructor";

        timediv.innerText = "時間："+item.stime+"〜"+item.etime;
        e.appendChild(timediv);
        namediv.innerText = "レッスン："+item.name;
        e.appendChild(namediv);
        instdiv.innerText = "インストラクター："+item.instructor;
        e.appendChild(instdiv);
    }
    return e;
}