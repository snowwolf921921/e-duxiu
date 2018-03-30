function getData() {                          
	var totalData = chrome.extension.getBackgroundPage().totalData;                       
	$("#testarea").text(totalData.displayData); 
}
function initClick() {                          
	document.querySelector('#bClear').addEventListener(                       
			'click', bClear);                                                     
	document.querySelector('#bStop').addEventListener(                       
			'click', chrome.extension.getBackgroundPage().bStop);                                                     
	document.querySelector('#bExport').addEventListener(                       
			'click', bExport);                                                     
}
function initPage() {   
	initClick();
	getData();
}
document.addEventListener('DOMContentLoaded', initPage);   
function bExport() {
	getData();
}