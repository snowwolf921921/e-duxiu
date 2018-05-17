﻿//restart 需要读取全局变量
var totalInfoAndCurrentDownloadInfo = {
	totalItemsAmount : 0,
	totalPageAmount : 0,
	currentDPageIndex : 0, // 1开始
	currentDItemIndexInTotal : 0,// 1开始
	currentDItemIndexInPage : 0,// 1开始
	cImageUrl:"",
	cPicName:""	
};
var currentDownloadInfo2 = {};
var totalData = {
	jsonTotalDatas : [],
	downloadStatus : "无",
	catchStatus : "无",
	error :"加载中...",
	displayData:""	
};
var maxDownloadConfig=-1;
var startDownloadConfig=-1;
var displayConfig={};
//默认可以翻页
var nextPageEnableFlag = true;
var intIntervalNextPage;
//时间间隔
var timeP=0;
var timeI=0;
var timeRnd=0;
var t=-1;
//chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest) {
	// 获取cs消息组装并记录供下面下载时使用并发送给popup显示
	if (request.type == "setBgConfig") {
		maxDownloadConfig=request.data.maxD;
		startDownloadConfig=request.data.startD;
		displayConfig=request.data.dConfig;
		timeP=request.data.time.p;
		timeI=request.data.time.i;
		timeRnd=request.data.time.rnd;
//		nextPageEnableFlag = true;
	}else if (request.type == "pupupStart-withConfig") {
		maxDownloadConfig=request.data.maxD;
		startDownloadConfig=request.data.startD;
		displayConfig=request.data.dConfig;
		timeP=request.data.time.p;
		timeI=request.data.time.i;
		timeRnd=request.data.time.rnd;
//		nextPageEnableFlag = true;
	    tSendMsgToCS("firstStart",{startDownloadConfig:startDownloadConfig});
	}else if (request.type == "pupupResume-withConfig") {
	    maxDownloadConfig=request.data.maxD;
	    startDownloadConfig=request.data.startD;
	    displayConfig=request.data.dConfig;
	    timeP=request.data.time.p;
		timeI=request.data.time.i;
		timeRnd=request.data.time.rnd;
	    if(checkMax()){
	    	nextPageEnableFlag = true;
	    	tSendMsgToCS("msg-catch&downloadThisItem-withTotalInfo",totalInfoAndCurrentDownloadInfo);
	    }else{
	       alert("已经下载到最大值")
	    }
	}else if (request.type == "wolf-catch-pagedata") {
		totalData.firstAccess = "获取中...";
		totalData.error = false;
		totalData.jsonTotalDatas = totalData.jsonTotalDatas
				.concat(request.data.records);
		totalData.displayData += request.data.pageDispalyText;
		tSendMsgToPopup("popup-displayData");
	} else if (request.type == "firstStartToBg") {
		//第一次接收，放入本地变量存储：
		totalInfoAndCurrentDownloadInfo=request.data;
		totalInfoAndCurrentDownloadInfo.currentDPageIndex=1;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal=startDownloadConfig;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInPage=1;
		//totalItemsAmount 已经在cs页中放入了
		//通知cs下载第一条；
		tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
	} else if (request.type == "currentItemInfo-downloadNextItem") {
		totalInfoAndCurrentDownloadInfo = request.data;
		var fileName=totalInfoAndCurrentDownloadInfo.keyword+""+totalInfoAndCurrentDownloadInfo.totalItemsAmount+"n"+totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+
		"p"+totalInfoAndCurrentDownloadInfo.currentDPageIndex
		+"i"+(totalInfoAndCurrentDownloadInfo.currentDItemIndexInPage+1)
		+totalInfoAndCurrentDownloadInfo.cPicName
		+".jpeg";
		chrome.downloads.download({url: totalInfoAndCurrentDownloadInfo.cImageUrl,filename:fileName,saveAs: false},function(id) {});
		
		var itemTrInfoWithNo="";
		var itemTrInfoNo="";
		if(displayConfig.dIndexInPage){
			itemTrInfoNo+="n"+totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+"";
		}
		if(displayConfig.dPageNo){
			itemTrInfoNo+="p"+totalInfoAndCurrentDownloadInfo.currentDPageIndex+"";
		}
		if(displayConfig.dNo){
			itemTrInfoNo+="i"+(totalInfoAndCurrentDownloadInfo.currentDItemIndexInPage+1)+"";
		}
		
		if(itemTrInfoNo.length>0){
			itemTrInfoWithNo=itemTrInfoNo+"^"+totalInfoAndCurrentDownloadInfo.itemTrInfo;
		}else{
			itemTrInfoWithNo=totalInfoAndCurrentDownloadInfo.itemTrInfo;
		}
		var keywordAndNo=""
		if(displayConfig.dKeywordAndNo){
			keywordAndNo=totalInfoAndCurrentDownloadInfo.keyword+":"+totalInfoAndCurrentDownloadInfo.totalItemsAmount
		}
		totalInfoAndCurrentDownloadInfo.itemTrInfoWithNo=keywordAndNo+itemTrInfoWithNo;
		totalData.displayData += totalInfoAndCurrentDownloadInfo.itemTrInfoWithNo;
		totalData.downloadStatus="已下载："+itemTrInfoNo+totalInfoAndCurrentDownloadInfo.cPicName;
		tSendMsgToPopup("popup-displayData");
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
		
		//翻页
		var bFlagIndexNeedNextPage=tCaltulatePageIndex(totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal,totalInfoAndCurrentDownloadInfo.itemsAmountPerPage)>totalInfoAndCurrentDownloadInfo.currentDPageIndex;
		if(checkMax()){
			if(nextPageEnableFlag){
//			!bFlagIndexNeedNextPage
				var r=tRnd(timeI-timeRnd,timeI+timeRnd);
				var t=setTimeout(function(){
					tSendMsgToPopup("popup-displayData");
					tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
				},r)
				totalData.downloadStatus="已下载："+itemTrInfoNo+totalInfoAndCurrentDownloadInfo.cPicName+"；已设置延迟"+r/1000+"秒后下载下一条";
//				tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
			}	
		}
	} else if (request.type == "currentItemInfo-waitdownload") {
		//待确定
		totalInfoAndCurrentDownloadInfo = request.data;
		totalData.displayData += totalInfoAndCurrentDownloadInfo.itemTrInfo;
		//只管加一的操作，其他的逻辑暂时放到cs中。
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
		tSendMsgToPopup("popup-displayData");
		tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
		
	}else if(request.type == "askCS-downloadSameItem-afterAWhile"){
		if(nextPageEnableFlag){
			totalInfoAndCurrentDownloadInfo = request.data;
			//setInterval定时不断执行，setTimeout只执行一次
			if(timeP){
				t=setTimeout(function(){
					
					tSendMsgToPopup("popup-displayData");
					tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
				},timeP)
			}
		}
	}
});

function checkMax(){
//没到最大返回true
	return (maxDownloadConfig==-1||maxDownloadConfig=="")?true:totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal<=maxDownloadConfig
}
function bStop() {
	nextPageEnableFlag=false;
	if (t!=-1){clearTimeout(t); }
	
};
/*chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
	suggest({
		filename : currentDownloadInfo2.totalNo + "-" + item.filename,
		conflict_action : 'overwrite',
		conflictAction : 'overwrite'
	});
	totalData.downloadStatus = "已经下载:" + currentDownloadInfo2.totalNo + "-"
			+ item.filename
	var msgDlNext = {};
	//新改动
	msgDlNext.type = "msg-catch&downloadThisItem-withTotalInfo";
	totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
	msgDlNext.totalInfoAndCurrentDownloadInfo = totalInfoAndCurrentDownloadInfo;
	// 通知cs下载下一个
	chrome.tabs.query({
		// active : true,
		currentWindow : true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msgDlNext, function(response) {
		});
	});
	chrome.tabs.query({
		active : true,
		currentWindow : true
	// url:"about:blank"
	}, function(tabs) {
		// 删除新打开的空白页
		chrome.tabs.remove(tabs[0].id);
	});
	// chrome.runtime.onMessage.addListener(catchStop);
	totalData.downloadStatus = "已经下载: " + currentDownloadInfo2.totalNo + "-"
			+ item.filename + ";" + "将要下载: " + msgDlNext.pageIndex

});
*/
function tCaltulatePageIndex(itemIndex,amountPerPage){
	if (amountPerPage!=0){
		return Math.ceil(itemIndex/amountPerPage);
	}else{
		return 0;
	}
}
var lastTabId=-1;
function tSendMsgToCS(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	if (lastTabId=-1){
		chrome.tabs.query({
//		 active : true,
			currentWindow : true
		}, function(tabs) {
			if(tabs.length>0){
				lastTabId=tabs[0].id;
				chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
//			console.log(response.farewell);
				});
			}
		});
	}else{
		chrome.tabs.sendMessage(lastTabId, msg, function(response) {
//			console.log(response.farewell);
				});
	}
};
function tSendMsgToPopup(msgType,data) {
//	totalData.totalInfoAndCurrentDownloadInfo=totalInfoAndCurrentDownloadInfo;
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.runtime.sendMessage(msg);
};
function tRnd(n, m){
    var random = Math.floor(Math.random()*(m-n+1)+n);
    return random;
}


