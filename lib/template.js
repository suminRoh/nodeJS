// 리팩토링 : 동작 방식은 같지만 내부의 코드를 효율적으로 바꾸는 행위 
var template={//객체를 통해 용두사가 동일했던 함수들을 모아 같이 정리 
    HTML:function(title,list,body,control){//template에 대한 함수를 만들어줌
      return `
      <!doctype html>
      <html>
      <head>
        <title>WEB1 - ${title}</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1><a href="/">WEB</a></h1>
        ${list}
        ${control}
        ${body}
      </body>
      </html>
      `;
    },List:function(filelist){//filelist들의 원소 각각 태그들로 만든 리스트 return
      var list='<ul>';
      var i=0;
      while(i<filelist.length){
        list=list+`<li><a href="/?id=${filelist[i].slice(0,-4)}">${filelist[i].slice(0,-4)}</a></li>`;//filelist 하나씩 list에 껴줌 (.txt없애기 위해 slice)
        i=i+1;
      }
      list=list+'</ul>';
      return list;
    }
  
  }

  module.exports=template;
//template의 객체를 외부에서 사용할 수 있도록 export 하겠다는 뜻 