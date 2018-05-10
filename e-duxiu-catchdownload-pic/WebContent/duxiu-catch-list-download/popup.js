chrome.runtime.onMessage.addListener(function(request, sender, sendRequest){
	if(request.type=="popup-displayData"){
		getData();
	}else if(request.type=="current-download-item-info"){
		
//		$("#message").text("正在下载"+request.data.totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+"-"+request.data.totalInfoAndCurrentDownloadInfo.itemTrInfoWithNo); 
	}else{
		return;
	}
});
function getData() {                          
	var totalData = chrome.extension.getBackgroundPage().totalData;     
	if(totalData.displayData!=null&&totalData.displayData.length){
		$("#testarea").text(totalData.displayData);
		$("#message").text(totalData.downloadStatus);
//		$("#message").text("正在下载"+chrome.extension.getBackgroundPage().totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+"-"+chrome.extension.getBackgroundPage().totalInfoAndCurrentDownloadInfo.cPicName+"");
	}else{
		//没取到数据
	}
	$("#maxDownloadConfig").val(chrome.extension.getBackgroundPage().maxDownloadConfig?chrome.extension.getBackgroundPage().maxDownloadConfig:100);
	$("#timeP").val(chrome.extension.getBackgroundPage().timeP?chrome.extension.getBackgroundPage().timeP/1000:2);
	$("#timeI").val(chrome.extension.getBackgroundPage().timeI?chrome.extension.getBackgroundPage().timeI/1000:15);
	$("#timeRnd").val(chrome.extension.getBackgroundPage().timeRnd?chrome.extension.getBackgroundPage().timeRnd/1000:9);
	$("#messageD").text("keyWord:"+chrome.extension.getBackgroundPage().totalInfoAndCurrentDownloadInfo.keyword+"; 共"+chrome.extension.getBackgroundPage().totalInfoAndCurrentDownloadInfo.totalItemsAmount+"条"); 
	
}
function initClick() {                          
	document.querySelector('#config').addEventListener('click', setBgConfig);                                                     
	document.querySelector('#bClear').addEventListener(                       
			'click', bClear);                                                     
	document.querySelector('#bStop').addEventListener(                       
			'click', chrome.extension.getBackgroundPage().bStop);  
	
	document.querySelector('#bStart').addEventListener('click', pBStart);                                                     
	document.querySelector('#bResume').addEventListener('click', pBResume);                                                     
//	document.querySelector('#bCheck').addEventListener('click', bCheck);                                                     
	document.querySelector('#bExport').addEventListener(                       
			'click', bExport);                                                     
//	document.querySelector('#bExportJson').addEventListener('click', bExportJson);                                                     
}
function setBgConfig(){
	var maxDownloadConfig=Number($("#maxDownloadConfig").val());
	tSendMsgToBg("setBgConfig",{maxD:maxDownloadConfig,dConfig:getDisplayConfig(),time:getTime()});
}
function pBStart(){
	var maxDownloadConfig=Number($("#maxDownloadConfig").val());
	 tSendMsgToBg("pupupStart-withConfig",{maxD:maxDownloadConfig,dConfig:getDisplayConfig(),time:getTime()});
}
function pBResume(){
	var maxDownloadConfig=Number($("#maxDownloadConfig").val());
	tSendMsgToBg("pupupResume-withConfig",{maxD:maxDownloadConfig,dConfig:getDisplayConfig(),time:getTime()});
}

function getDisplayConfig(){
	var displayConfig={};
	displayConfig.dNo=$("input:checkbox[name='dNo']").is(":checked")
	displayConfig.dPageNo=$("input:checkbox[name='dPageNo']").is(":checked")
	displayConfig.dIndexInPage=$("input:checkbox[name='dIndexInPage']").is(":checked")
	displayConfig.dKeywordAndNo=$("input:checkbox[name='dKeywordAndNo']").is(":checked")
	return displayConfig;
}
function getTime(){
	return {p:Number($("#timeP").val())*1000,i:Number($("#timeI").val())*1000,rnd:Number($("#timeRnd").val())*1000}
}

function initPage() {   
	initClick();
	getData();
}

function bCheck() {
	var result = chrome.extension.getBackgroundPage().totalData.jsonTotalDatas;	
	//jsonTotalDatas 格式 [{row},{}..]
/*	row.pageNo = currentPageNo;
	row.no = $(trOne).children("td").eq(0).text();
	row.wenxianming = $(trOne).children("td").eq(1).text();
	row.date =  $(trOne).children("td").eq(2).text();
	row.banci = $(trOne).children("td").eq(3).text();
	row.title = $(trOne).children("td").eq(4).find("a").text();
	row.author = $(trOne).children("td").eq(5).text();*/
	var i=result[0].no;
	loseRows="";
	for (var key in result){
		if (key>1){
			for (var j=Number(result[key-1].no)+1;j<Number(result[key].no);j++){
				loseRows+=j+",";
			}
		}
	};
	if (loseRows.length==0){
		$("#message").text("数据完整"); 
	}else{
		$("#message").text("缺少如下数据："+loseRows); 
	}
}
function utf8_to_b64( str ) {
    return window.btoa(unescape(encodeURIComponent( str )));
}
function bExport() {
//	var result = JSON.stringify(items);		
//	var result = JSON.stringify("{result:[]}");		
	var result = chrome.extension.getBackgroundPage().totalData.displayData;		
//	chrome.tabs.create({url:chrome.extension.getURL("tabs_api.html")});
	/* chrome.app.window.create('window.html', {
		  	id: "mainwin",
		    innerBounds: {
		      width: 700,
		      height: 600
		    }
		  });*/
    // Save as file
    var url = 'data:application/txt;base64,' + utf8_to_b64(result);
    chrome.downloads.download({
        url: url,
        filename: 'filename_of_exported_file.txt'
    });
}
function bExportJson() {
//	var result = JSON.stringify(items);		
//	var result = JSON.stringify("{result:[]}");		
	var result = chrome.extension.getBackgroundPage().totalData.jsonTotalDatas;		
	var url = 'data:application/json;base64,' + utf8_to_b64(JSON.stringify(result));
	chrome.downloads.download({
		url: url,
		filename: 'filename_of_exported_file.json'
	});
}

function bClear(){
	chrome.extension.getBackgroundPage().totalData={jsonTotalDatas:[]};
	$("#testarea").text(""); 
}

document.addEventListener('DOMContentLoaded', initPage);                                                                                  

function tSendMsgToBg(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.runtime.sendMessage(msg);
};

