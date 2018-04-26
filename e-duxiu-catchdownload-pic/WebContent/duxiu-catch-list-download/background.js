//restart 需要读取全局变量
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
	catchStatus : "无"
};
var maxDownloadConfig=-1;
//默认可以翻页
var nextPageEnableFlag = true;
var intIntervalNextPage;
totalData.error = "加载中...";
//chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.runtime.onMessage.addListener(function(request, sender, sendRequest) {
	// 获取cs消息组装并记录供下面下载时使用并发送给popup显示
	if (request.type == "popupStartWithConfig") {
		maxDownloadConfig=request.data.maxD;
        nextPageEnableFlag = true;
    	tSendMsgToCS("firstStart",{});
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
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal=1;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInPage=1;
		//totalItemsAmount 已经在cs页中放入了
		//通知cs下载第一条；
		tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
	} else if (request.type == "currentItemInfo-downloadNextItem") {
		totalInfoAndCurrentDownloadInfo = request.data;
		var fileName="n"+totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+
		"p"+totalInfoAndCurrentDownloadInfo.currentDPageIndex
		+"i"+totalInfoAndCurrentDownloadInfo.currentDItemIndexInPage
		+totalInfoAndCurrentDownloadInfo.cPicName
		+".jpeg";
		
		chrome.downloads.download({url: totalInfoAndCurrentDownloadInfo.cImageUrl,filename:fileName,saveAs: false},function(id) {
		});
		totalData.displayData += totalInfoAndCurrentDownloadInfo.itemTrInfo;
		tSendMsgToPopup("popup-displayData");
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
		var bFlagIndexNeedNextPage=tCaltulatePageIndex(totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal,totalInfoAndCurrentDownloadInfo.itemsAmountPerPage)>totalInfoAndCurrentDownloadInfo.currentDPageIndex;
//		alert(totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+","+totalInfoAndCurrentDownloadInfo.itemsAmountPerPage+","+totalInfoAndCurrentDownloadInfo.currentDPageIndex);
		if(((maxDownloadConfig==-1||maxDownloadConfig=="")?true:totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal<=maxDownloadConfig)){
//			if((totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal<=totalInfoAndCurrentDownloadInfo.totalItemsAmount)){
			if(!(!nextPageEnableFlag&&bFlagIndexNeedNextPage)){
				tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
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
			var t=setTimeout(function(){
				tSendMsgToPopup("popup-displayData");
				tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
			},2000)
		}
	}
});

function bStop() {
	nextPageEnableFlag=false;
};
function bStart() {
	 /*chrome.storage.sync.get(['maxD'], function(result) {
	        console.log('Value currently is ' + result.maxD);
	        maxDownloadConfig=result.maxD;
	        nextPageEnableFlag = true;
	    	tSendMsgToCS("firstStart",{});
	      });
	*/
};
function bResume() {
	nextPageEnableFlag = true;
	tSendMsgToCS("msg-catch&downloadThisItem-withTotalInfo",totalInfoAndCurrentDownloadInfo);
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
function tSendMsgToCS(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.runtime.sendMessage(msg);
	
/*	chrome.tabs.query({
//		 active : true,
		currentWindow : true
	}, function(tabs) {
		if(tabs.length>0){
			chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
			});
		}
	});*/
};
function tSendMsgToPopup(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.runtime.sendMessage(msg);
};

