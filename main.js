var http = require('http');
var fs = require('fs');
var url=require('url');//url이라는 모듈 사용한다는 것
var qs=require('querystring');
var template=require('./lib/template.js');//tenplate.js의 module사용
var path=require('path');
var sanitizeHtml=require('sanitize-html');//웹을 변경시킬 수 있는 예민한 태그들을 text로 쓰면 제거해버리는 효과 

var app = http.createServer(function(request,response){
  
  /*
  createServer: 웹서버를 만들고 웹서버에서 요청이 들어올때마다 첫번째 인자에 해당되는 함수를 호출
  웹브라우저 들어올때마다 createServer의 callback함수를 nodejs가 호출 `function(request,response){}`
  request: 요청할 때 웹브라우저가 user에게 보낸 정보들 담겨 있음 
  response: 응답할 때 user가 웹브라우저에게 전송할 정보들 담겨 있음 
  */
  var _url = request.url;
  var queryData=url.parse(_url,true).query;
  var pathname=url.parse(_url,true).pathname;//어떤 경로로 들어왔는지 확인
  if(pathname==='/'){//route일 때
    if(queryData.id===undefined){//id 없는 home 말하는 것
      fs.readdir('./data',function(error,filelist){//data 폴더에 있는 파일들을 읽어 filelist라는 배열로 만듦
        var title='Welcome!';
        var description='Hello, Node.js';
        var list=template.List(filelist);
        var html=template.HTML(title,list,`<h2>${title}</h2>${description}`,
        `<a href="/create">create</a>]`);
        response.writeHead(200);//200이라는 숫자를 서버가 브라우저에게 주면 파일을 성공적으로 전송했다는 뜻
        response.end(html);//웹에 template출력
    
      });
  
    } else{    
      fs.readdir('./data',function(error,filelist){//data 폴더에 있는 파일들 이름을 filelist라는 배열로 만듦
        var filteredId=path.parse(queryData.id).base; //정보보안을 위해 데이터중 base만 전달
        fs.readFile(`data/${filteredId}.txt`, 'utf8',
        function(err,description){
          var list=template.List(filelist);
          var title=queryData.id;
          var sanitizedTitle=sanitizeHtml(title);
          var sanitizedDescription=sanitizeHtml(description);//태그들을 못쓰도록 살균, allowedTags안에 들어있는 태그들은 사용 가능 
          var html=template.HTML(sanitizedTitle,list,
            `<h2>${sanitizedTitle}</h2> ${sanitizedDescription}`,
            `<a href="/create">create</a>
            <a href="/update?id=${sanitizedTitle}">update</a>
            <form action="delete_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`);
          response.writeHead(200);
          response.end(html);
        });
      });
      }

      /*
      웹주소에서 id값을 바꾸면 ${title}라고 한 부분, 전체 바뀜
      <a href="/?id=CSS"> :href 부분에 id값을 쓰면 그 태그 눌렀을 때,id 값이 바껴서 웹주소 id부분과 title 모두 바뀜
      fs.readFile에서 변수 description으로 받았기 때문에 ${}시 해당되는 부분의 본문 출력 
      */
      
  } else if(pathname==='/create'){//create 눌렀을 때
    fs.readdir('./data',function(error,filelist){
      var title='Web - create';
      var list=template.List(filelist);
      var html=template.HTML(title,list,`
      <h2>${title}</h2>
      <form action="/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p> 
        <p>
            <textarea name="description" placeholder="description"></textarea>
        </P>
        <p><input type="submit"></p> 
      </form>
      `,'');//form 을 body에 배치
      response.writeHead(200);
      response.end(html);
    });
  } else if(pathname==='/create_process'){//create 창에서 submit 버튼 누른 경우
    var body='';
    request.on('data',function(data){
      //웹브라우저가 post방식으로 전송되는 데이터가 많은 경우를 대비해 request.on 사용
      //특정한 양을 수신할 때마다 서버는 콜백함수인 function(data)를 호출해 data라는 인자를 통해 수신한 정보를 주가로 약속
      body=body+data;
    });

    request.on('end',function(){
      //더이상 들어올 데이터가 없으면 이 end 뒤의 callback 함수가 실행되도록 약속
      var post=qs.parse(body); //post데이터에 지금까지 입력한 data들 들어있는 body를 저장해서 객체화 시킴
      var title=post.title;
      var description=post.description;
      fs.writeFile(`data/${title}.txt`,description,'utf8',function(err){
        console.log(description);
        response.writeHead(302,{Location:`/?id=${title}`}); //Location으로 redirecrion(파일이 data에 저장되고 바로 서버로 이동)
        response.end();
      });   
    });
  }else if(pathname==='/update'){
    fs.readdir('./data',function(error,filelist){
      var filteredId=path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}.txt`, 'utf8',
      function(err,description){
        var title=queryData.id;
        var list=template.List(filelist);
        var html=template.HTML(title,list,`
        <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}"> 
          <p><input type="text" name="title" placeholder="title" value="${title}"></p> 
          <p>
              <textarea name="description" placeholder="description">${description}</textarea>
          </P>
          <p><input type="submit"></p> 
        </form>
        `,
        `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
        /*
        html의 input 태그는 value라는 속성에 props 넣어주면 기본값으로 그 props가 들어가게됨
        name="id"는 update한 내용을 기존title에 보내기 위해 기존 title과 update된 title을 구분시키려고 만듦(user에게 보일 필요 없으니 type=hidden)
        */
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if(pathname==='/update_process'){
    var body='';
    request.on('data',function(data){
      body=body+data;
    });

    request.on('end',function(){
      var post=qs.parse(body); 
      var title=post.title;
      var id=post.id;
      var description=post.description;
      fs.rename(`data/${id}.txt`,`data/${title}.txt`,function(error){
        fs.writeFile(`data/${title}.txt`,description,'utf8',function(err){
          response.writeHead(302,{Location:`/?id=${title}`}); //Location으로 redirecrion(파일이 data에 저장되고 바로 서버로 이동)
          response.end();
      });

      })
      console.log(post);
     
    });
    
  } else if(pathname==='/delete_process'){
    var body='';
    request.on('data',function(data){
      body=body+data;
    });

    request.on('end',function(){
      var post=qs.parse(body); 
      var id=post.id;
      var filteredId=path.parse(id).base;
      fs.unlink(`data/${filteredId}.txt`,function(error){
        response.writeHead(302,{Location:`/`});//redirection home으로 감
          response.end();
      })
    });
    
  } else{//path가 없는 경로로 접속했다면
    response.writeHead(404);//파일을 찾을 수 없는 경우
    response.end('Not found');
  }

   
 
});
app.listen(3000);//요청에 대해서 응답할 수 있도록 http 서버를 구동시킴 