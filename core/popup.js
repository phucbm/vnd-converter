//add decimal points to number
function addDecimalPoints(str,dot) {
	str = str.toString();
    str=str.replace(/\D/g, '');
    var inputValue = str.replace(".", '').split("").reverse().join(""); //xoa dau cham dang co va reverse
    var newValue = '';
    for (var i = 0; i < inputValue.length; i++) {
        if (i % dot == 0) { newValue += '.'; }
        newValue += inputValue[i];
    }
    str = newValue.split("").reverse().join("");
	str = str.slice(0,str.length-1);//xóa dấu chấm bị dư
	return str;
}

//vietnamese, space filter
function locKiTu(str){
	str= str.toLowerCase();
	str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str= str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
	str= str.replace(/đ/g,"d");
	str= str.replace(/ /g,"");
	str= str.replace(/k/g,"nghin");
	return str;
}

//get number from input
function tachSo(chuoi){
	var so = "0";
	for(var i=0;i<chuoi.length;i++){
		//lay so, dau cham, dau phay
		if(chuoi.charCodeAt(i)>=48 && chuoi.charCodeAt(i)<=57 || chuoi[i]=="."){
			so += chuoi[i];
		}
	}
	return parseFloat(so);
}

//get current tab url
var url;
chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		 // since only one tab should be active and in the current window at once
		 // the return variable should only have one entry
		 var activeTab = arrayOfTabs[0];
		 url = activeTab.url; // or do whatever you need
		 //alert(url);
});
function tiGia(chuoi){
	//alert(chuoi);
	for(var cur = 0; cur < currency.length; cur++){
			for(var site = 0; site < currency[cur].site.length; site++){
				if(url.indexOf(currency[cur].site[site])>=0){
					return { "tigia" : currency[cur].rate, "tiente" : currency[cur].name, "url": currency[cur].site[site] };
				}
			}
			for(var sym = 0; sym < currency[cur].symbols.length; sym++){
				if(chuoi.indexOf(currency[cur].symbols[sym])>=0){
					return { "tigia" : currency[cur].rate, "tiente" : currency[cur].name };
				}
			}
		}
		return { "tigia" : 1, "tiente" : "null", "url": "null" };
}

//error filter
function isSuccess(chuoi) {
	$("#output").html('');
	$("#rounded").html('');
	$("#tigia").html('');
	//chuoi rong
	if(chuoi==""){$("#noti").html("Hãy quét chọn hoặc gõ ngoại tệ mà bạn muốn đổi.");return false;}
	//chuoi qua dai
	if(chuoi.length>20){$("#noti").html("Hãy chọn số tiền ngắn hơn.");return false;}
	//khong thay don vi tien te
	if(tiGia(chuoi).tiente=="null"){$("#noti").html("Hãy chọn đơn vị tiền tệ.");return false;}
	//khong thay so tien
	if(tachSo(chuoi)==""){$("#noti").html("Hãy chọn số tiền.");return false;}
	$("#noti").html(update); // update is global var from currency.json
	return true;
}

//exchange and return output
function chuyenDoi(chuoi,mode){
	if(mode=="manual"){
		chuoi = chuoi.value;
	}
	if(mode=="auto"){
		$("#manual_input").val(chuoi);
	}
	chuoi = locKiTu(chuoi);
	if(isSuccess(chuoi)){
		input = tachSo(chuoi).toFixed(2).toString() + tiGia(chuoi).tiente;
		ti_gia_hien_tai = "Tỉ giá: 1 " + 
			tiGia(chuoi).tiente + " = " + 
			tiGia(chuoi).tigia + " VNĐ";
		chuoi = (tachSo(chuoi)*tiGia(chuoi).tigia).toFixed(2);
		output = input + " = " + chuoi + ' VNĐ';
		rounded = "Làm tròn là: "+addDecimalPoints(Math.round(chuoi),3)+" VNĐ";
		$("#output").html(output);
		$("#rounded").html(rounded);
		$("#tigia").html(ti_gia_hien_tai);
		if(tiGia(chuoi).url!="null") {
			$("#noti").html("Tự động nhận biết đơn vị tiền tệ dựa trên trang web.<br>"+update);
		}
	}
}

//listen from selected text
chrome.tabs.executeScript( {
    code: "window.getSelection().toString();"
}, function(selection) {
	chuyenDoi(selection[0],'auto');
});


//listen from manual exchange
document.addEventListener('DOMContentLoaded', documentEvents  , false);
function documentEvents() {    
  document.getElementById('manual_input').addEventListener('keyup', 
    function() { chuyenDoi(document.getElementById('manual_input'),'manual');
  });

  $('body').on('click', 'a', function(){
     chrome.tabs.create({url: $(this).attr('href')});
     return false;
   });
  // you can add listeners for other objects ( like other buttons ) here 
}