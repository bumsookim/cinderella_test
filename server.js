/**
// 		VER 1.0
 		
 		index.html -> q.html -> (q_save.html) -> nick.html -> (n_check.html) -> room.html
 		   page        page          url           page            url            page
 		   
 		라우터 페이지 : 주소와 페이지가 모두 존재한다.
 		라우터 URL : 주소는 존재하지만 페이지가 존재하지 않는다.

		room.html (퇴장) -> (exit) -> q.html -> 앱종료 or 질문 다시
 			page			url		  page

		room.html (강퇴) -> (kick) -> q.html -> 질문 다시 or 앱 종료
			page			url		  page
		
		room.html (강퇴) -> 
 		


 		index.html 파라미터
 		[com]
 		  1 : q_save -> index.html [ 방이 가득찼음 ]
 		  2 : q_save -> index.html [ 접속 정지 ]
 		  3 : q_save -> index.html [ 방에서 강퇴당함 ]
		   
		퇴장, 강퇴, 비정상종료 시 닉네임 변경값
		exit => exit01
		kick => exit02
		disconnect uuid 존재시 => exit03
		disconnect uuid null => exit04
		
 **/

var fs            = require('fs');
var http         = require('http');
var express     = require('express');
var socketio    = require('socket.io');
var app          = express();
var ArrayList    = require('list');
var mongoose  = require('mongoose');

mongoose.connect ('mongodb://localhost/cinderella', function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('connected to mongodb!!');
    }
});

/*
var chatSchema = mongoose.Schema ({
    nick: String,
    message: String,
    room: String,
    created: {type: Date, default: Date.now}

});

var Chat = mongoose.model('Message', chatSchema, 'Msg');

var userSchema = mongoose.Schema ({
    uuid: String,
    s_id: String,
    kick: String,
    kick_room: String,
    room: String,
    nick: String, 
    grade: String,
    date: String,
    whis: String,
    enter_room: {type: Date, default: Date.now},
    exit_room: {type: Date, default: Date.now}
});
var User = mongoose.model('User', userSchema, 'User');
*/

app.use(express.cookieParser());
app.use(express.session({ secret: 'secret key', cookie: { maxAge: 60 * 60 * 24 } }));
app.use(app.router);


/**************************************************************
 전역변수
**************************************************************/

var list = new ArrayList();	// 사용자 리스트 전역변수


/**************************************************************
전역변수
**************************************************************/



function user_check(uuid) {

    var count = 0;
    for (i = 0; i < list.length; i++) {
        if (list.get(i).uuid == uuid)			// 대상을 찾고
        {
            count++;
        }
    }

    return count;
}



/**************************************************************
 서버 URL 라우터 시작
**************************************************************/


// (1) 시작페이지
app.all('/', function (request, response) {

    fs.readFile('index.html', function (error, data) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(data);
    });
});

app.all('/admin', function (request, response) {

    fs.readFile('admin.html', function (error, data) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(data);
    });
});

app.all('/re', function (request, response) {

    fs.readFile('error.html', function (error, data) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(data);
    });
});

// (2) 체크페이지 : 신규(3번으로), 재접속 판단
app.all('/login', function (request, response) {

    var uuid = request.param('uuid');
    request.session.uuid = uuid;

    if (uuid === null || uuid === "" || uuid === " " || uuid === "undefined") {
        response.writeHead(302, { 'Location': '/re?num=' + '5' });
        response.end();
    }
    else {
        response.writeHead(302, { 'Location': '/q.html' });
        response.end();
    }
});

// (3) 질문
app.get('/q.html', function (request, response) {
    fs.readFile('q.html', function (error, data) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(data);
    });
});


// (4) 질문 저장 URL
app.all('/q_save', function (request, response) {

    var count = 0;		// 방 인원

    var q1 = request.param("q1");
    var q2 = request.param("q2");
    var q3 = request.param("q3");

    request.session.room = q1 + q2 + q3;

    for (i = 0; i < list.length; i++) {
        if (list.get(i).room == request.session.room)
            count++;
    }

    if (count < 5) {		// 방제한
        response.writeHead(302, { 'Location': '/nick.html' });
        response.end();
    }
    else {
        response.writeHead(302, { 'Location': '/re?num=' + '1' });
        response.end();
    }

});

// (5) 닉네임 페이지
app.all('/nick.html', function (request, response) {

    fs.readFile('nick.html', function (error, data) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(data);
    });

    connect = 0;	// 정상적인 접속
});

// 닉네임 체크 URL
app.all('/n_check.html', function (request, response) {

    var nickname = request.param("nick");
    var n_flag = 0;							// 닉네임 중복검사

    if (nickname === "" || nickname === " " || nickname === "  " || nickname === "   " || nickname === "    " || nickname === "     ")
        n_flag++;


    for (i = 0; i < list.length; i++) {
        if (nickname == list.get(i).nick)
            n_flag++;
    }

    if (n_flag === 0)			// 닉네임이 중복이 아니면
    {
        request.session.nick = nickname;

        response.writeHead(302, { 'Location': '/room.html' });
        response.end();
    }
    else					// 중복이면
    {
        response.writeHead(302, { 'Location': '/re?num=' + '4' });
        response.end();
    }

});

// 룸 페이지 URL
var uuid_check = 0;
app.all('/room.html', function (request, response) {
    if (request.session.uuid == null || request.session.uuid == "") {
        uuid_check++;
    }
    else {
        uuid_check = 0;
    }
    if (uuid_check == 0) {
        response.writeHead(302, { 'Location': '/room/' + request.session.room + '?uuid=' + request.session.uuid });
        response.end();
    }
    else {
        response.writeHead(302, { 'Location': '/re?num=' + '5' });
        response.end();
    }
});




app.all('/room/:id', function (request, response) {

    var room = request.session.room;
    var nick = request.session.nick;
    var uuid = request.session.uuid;

    var kick_flag = 0;

    var check = 0;
    check = user_check(uuid);

    if (check === 0) {		// 신규유저
        list.add({ room: room, nick: nick, whis: 5, uuid: uuid, s_id: '', kick: 0, kick_room: '', grade: 0, date: 0 });

    }
    else {				// 기존유저

        for (i = 0; i < list.length; i++) {
            if (list.get(i).uuid == uuid)		// 유저 정보를 받아옴
            {
                list.get(i).room = room;
                list.get(i).nick = nick;
                list.get(i).s_id = '';
                list.get(i).grade = 9;

                if (list.get(i).kick_room == room) {
                    kick_flag = list.get(i).kick;
                    list.get(i).nick = '';
                }
                else if (list.get(i).kick == 3) {
                    kick_flag = list.get(i).kick;
                    list.get(i).nick = '';
                }
            }
        }


    }


    if (kick_flag === 0) {
        fs.readFile('room.html', function (error, data) {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(data);
        });
    }
    else if (kick_flag > 2) {
        for (i = 0; i < list.length; i++) {
            if (list.get(i).uuid == uuid)		// 유저 정보를 받아옴
            {
                list.get(i).room = '';
                list.get(i).nick = '';
                list.get(i).s_id = '';
                list.get(i).grade = 9;
            }
        }
        response.writeHead(302, { 'Location': '/re?num=' + '2' });
        response.end();
    }
    else {
        for (i = 0; i < list.length; i++) {
            if (list.get(i).uuid == uuid)		// 유저 정보를 받아옴
            {
                list.get(i).room = '';
                list.get(i).nick = '';
                list.get(i).s_id = '';
                list.get(i).grade = 9;
            }
        }
        response.writeHead(302, { 'Location': '/re?num=' + '3' });
        response.end();
    }
});

/**************************************************************
서버 URL 라우터 끝
**************************************************************/


/**************************************************************
  클라이언트 요청 이벤트 라우터 시작
 **************************************************************/

app.get('/exit', function (request, response) {

    var uuid = request.param("uuid");
    for (i = 0; i < list.length; i++) {
        if (list.get(i).uuid == uuid)			// 대상을 찾고
        {
            list.get(i).room = '000';
            list.get(i).nick = '정상 종료';
            list.get(i).date = new Date();
            list.get(i).s_id = '정상종료';
            console.log("정상적으로 종료한 유저: " + uuid);
        }
    }
    response.writeHead(302, { 'Location': '/re?num=' + '0' });
    response.end();
});

app.get('/exit2', function (request, response) {

    var uuid = request.param("uuid");
    for (i = 0; i < list.length; i++) {
        if (list.get(i).uuid == uuid)			// 대상을 찾고
        {
            list.get(i).room = '000';
            list.get(i).nick = '비정상 종료';
            list.get(i).date = new Date();
            list.get(i).s_id = '비정상종료';
            console.log("비정상적으로 종료한 유저: " + uuid);
        }
    }
    response.writeHead(302, { 'Location': '/re?num=' + '6' });
    response.end();
});

app.get('/kick', function (request, response) {

    var n = request.param("nick");
    var r = request.param("room");
    var k;
    var num = 3;

    for (i = 0; i < list.length; i++) {
        if (list.get(i).nick == n)			// 대상을 찾고
        {
            k = list.get(i).kick;
            list.get(i).room = '000';
            list.get(i).nick = '강퇴자';
            list.get(i).kick = list.get(i).kick + 1;
            list.get(i).kick_room = r;
            list.get(i).date = new Date();
            list.get(i).s_id = '';
            console.log("exit02 : " + list.get(i).uuid);
        }
    }

    if (k > 2)
        num = 2;

    response.writeHead(302, { 'Location': '/re?num=' + num });
    response.end();
});

/**************************************************************
   클라이언트 요청 이벤트 라우터 끝
 **************************************************************/



/**************************************************************
   서버 이미지 및 CSS 파일 라우터 시작
 **************************************************************/

app.all('/images/:id', function (request, response) {

    var name = request.param('id');

    fs.readFile('images/' + name, function (error, data) {
        response.writeHead(200, { 'Content-Type': 'image/png' });
        response.end(data);
    });
});

app.all('/img/:id', function (request, response) {

    var name = request.param('id');

    fs.readFile('img/' + name, function (error, data) {
        response.writeHead(200, { 'Content-Type': 'image/png' });
        response.end(data);
    });
});

app.all('/css/:id', function (request, response) {
    var name = request.param('id');

    fs.readFile('css/' + name, function (error, data) {
        response.writeHead(200, { 'Content-Type': 'text/css' });
        response.end(data);
    });
});

/**************************************************************
   서버 이미지 및 CSS 파일 라우터 끝
 **************************************************************/

var port = process.env.PORT || 52273;
var server = http.createServer(app).listen(port, function () {
    //var server = http.createServer(app).listen(52273, function(){
    console.log('server start');
});

var io = socketio.listen(server);



io.sockets.on('connection', function (socket) {

    socket.on('init', function (data) {		// 유저 체크 이벤트
        console.log("connect");
        console.log("Socketid:" +socket.id);
        var logintime = new Date();
        var lt;
        lt = logintime.getHours() * 1000000 + logintime.getMinutes() * 10000 + logintime.getSeconds() * 100 + logintime.getMilliseconds();
        for (i = 0; i < list.length; i++) {
            if (list.get(i).uuid == data.uuid)			// 대상을 찾고
            {
                var temp = [5];
                //if(list.get(i).nick != null)
                socket.nick = temp[0] = list.get(i).nick;
                socket.room = temp[1] = list.get(i).room;
                socket.uuid = temp[2] = list.get(i).uuid;
                list.get(i).date = lt;
                socket.date = temp[4] = list.get(i).date;
                list.get(i).s_id = socket.id;
                socket.join(socket.room);
                io.sockets.in(socket.id).emit('init', temp);
                io.sockets.in(socket.room).emit('comment', { message: socket.nick + '님이 위풍당당 입장하셨네요!' });

                console.log("Nickname:" + socket.nick);
                console.log("UUID:" + socket.uuid);
                console.log("ROOM:" + socket.room);
            }
        }

    });

    socket.on('message', function (data) {	// 기본 채팅 이벤트

        var msg = data.message;
        var date = data.date;

        //var newMsg = new Chat ({message: msg, nick: socket.nick, room: socket.room});
        //newMsg.save(function(err){
            //if (err) throw err;
                io.sockets.in(socket.room).emit('message', { message: msg, date: date, nick: socket.nick, room: socket.room });
        //});

    });

    socket.on('user', function (data) {		// 채팅방 참가자 목록 전송

        var TEMP = [list.length];
        var wc = 0;	// 남은 귓속말 담을 변수
        var cnt = 0;
        var TEMPlist = [list.length];
        var cnt2 = 1;
        // 자신의 정보를 찾음
        for (i = 0; i < list.length; i++) {
            if (list.get(i).uuid == data.uuid)	// 나의 아이디 찾음
            {
                wc = list.get(i).whis;
            }
        }

        for (i = 0; i < list.length; i++) {
            if (list.get(i).room == data.room) {
                TEMP[cnt++] = { room: list.get(i).room, nick: list.get(i).nick, whis: wc, grade: 10, date: list.get(i).date };
            }
        }
        for (y1 = 0; y1 < cnt - 1; y1++) {
            for (y2 = y1 + 1; y2 < cnt; y2++) {
                if (TEMP[y1].date > TEMP[y2].date) {
                    TEMPlist[0] = TEMP[y1];
                    TEMP[y1] = TEMP[y2];
                    TEMP[y2] = TEMPlist[0];
                }
            }
        }
        for (a = 0; a < cnt; a++) {
            TEMP[a].grade = cnt2;
            cnt2++;
        }
        io.sockets.in(socket.room).emit('user', TEMP);
    });


    socket.on('whisper', function (data) {	// 기본 채팅 이벤트

        var my = data.my; 		//룸에서 보내온 내 닉네임
        var you = data.you;		//룸에서 보내온 상대 네임
        var msg = data.msg;		//귓속말내용
        var date = data.date;	//귓속말시간
        var uuid = data.uuid;	//자신 uuid
        var my_id = 000;	// 나의 아이디
        var id;		// 상대 아이디 찾음, 귓말 수가 없으면 자신의 아이디
        var check = 0;


        for (i = 0; i < list.length; i++) {
            if (list.get(i).nick == you)	// 상대 아이디 찾음
            {
                id = list.get(i).s_id;
            }
        }

        if (my != you) {
            for (i = 0; i < list.length; i++) {
                if (list.get(i).nick == my)	// 나의 귓속말 감소
                {
                    if (list.get(i).s_id != '')
                        my_id = list.get(i).s_id;	// 나의 아이디 찾음
                    if (list.get(i).whis > 0)
                        list.get(i).whis = list.get(i).whis - 1;
                    else
                    {
                        msg = '오늘 귓속말은 여기까지~';  // 귓속말이 없어요 // 귓속말을 충전하셔야 해요
                        id = list.get(i).s_id;
                    }
                }

            }
            if (my_id != '000')
            {
                io.sockets.in(id).emit('comment', { message: my + '님께서 비밀스럽게 전달해 달라네요' });
                io.sockets.in(my_id).emit('comment', { message: you + '님께 속삭이듯 귓속말을 전했어요~' });
                io.sockets.in(id).emit('whisper', { message: msg, date: date, nick: my });	// 나에게 보내고
                io.sockets.in(my_id).emit('whisper', { message: msg, date: date, nick: my });	// 나에게 보내고
            }
        }
        else {
            msg = '나에게는 귓속말을 보낼 수 없어요~';
            io.sockets.in(id).emit('comment', { message: msg });
        }

    });


    socket.on('kick', function (data) {	// 강퇴 메세지(모두에게 알림)

        var my = data.my;
        var you = data.you;
        var room = data.room;
        var my_id = '000';
        var cnt = 0;

        for (i = 0; i < list.length; i++) {
            if (list.get(i).nick == my)	// 나의 아이디 찾음
                if (list.get(i).s_id != '') {
                    my_id = list.get(i).s_id;
                    console.log("강퇴권한자 : " + my);
                }
        }

        for (i = 0; i < list.length; i++) {								// 같은 방에 해당 아이디 있는지 찾음
            if (list.get(i).nick == you && list.get(i).room == room) {
                cnt++;
                console.log("강퇴 대상 : " + you);
            }
        }

        if (cnt === 0) {
            console.log("kick 실패 : " + my + " to " + you + " 상대방없음");
            io.sockets.in(my_id).emit('comment', { message: '방에 그런분이 없네요~' });
        }
        else if (my_id === '000') {
            console.log("kick 실패 : " + my + " to " + you + " 자신 연결이 끊어짐.");
            io.sockets.in(my_id).emit('comment', { message: '연결이 끊어져있어요! 재접속해주세요!' });
        }
        else {
            console.log("kick : " + my + " to " + you + " 강퇴 성공");
            io.sockets.in(socket.room).emit('comment', { message: my + '님이 ' + you + '님을 강퇴하셨어요!' });
            io.sockets.in(socket.room).emit('kick', { my: my, you: you });

        }
    });

    socket.on('notice', function (data) {	// 강퇴 메세지(모두에게 알림)

        for (i = 0; i < list.length; i++) {
            if (list.get(i).s_id !== '') {
                io.sockets.in(list.get(i).s_id).emit('comment', { message: data });
                console.log("전체메세지 : " + data);
            }
        }

    });

    socket.on('list', function (data) {	// 강퇴 메세지(모두에게 알림) //체크 필요....뭔 말인지 이해 안됨

        var nick = [list.length];
        var room = [list.length];
        var uuid = [list.length];
        var s_id = [list.length];
        var whis = [list.length];
        var date = [list.length];
        var kick = [list.length];

        for (i = 0; i < list.length; i++) {
            nick[i] = list.get(i).nick;
            room[i] = list.get(i).room;
            uuid[i] = list.get(i).uuid;
            s_id[i] = list.get(i).s_id;
            whis[i] = list.get(i).whis;
            date[i] = list.get(i).date;
            kick[i] = list.get(i).kick;
        }


        io.sockets.in(socket.id).emit('list', { nick: nick, room: room, uuid: uuid, s_id: s_id, whis: whis, date: date, kick: kick });
    });

    socket.on('user left', function () {
        socket.disconnect();
        io.sockets.in(socket.room).emit('comment', { message: socket.nick + '님이 퇴장하셨네요!' });
        socket.emit('user');        
        console.log("떠남: " + socket.nick);
        console.log("떠나는 자의 uuid:" + socket.uuid);

    });

    socket.on('user left2', function () {
        socket.disconnect();
        io.sockets.in(socket.room).emit('comment', { message: socket.nick + '님이 접속이 끊겼네요!' });
        socket.emit('user');
        console.log("비정상떠남: " + socket.nick);
        console.log("비정상떠나는 자의 uuid:" + socket.uuid);

    });


    socket.on('disconnect', function (data) {
        console.log("disconnect nick : " + socket.nick);
        console.log("disconnect uuid : " + socket.uuid);            
    }); 
});