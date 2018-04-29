/* Copyright 2016 Phucbm */
//add decimal points to number
function addDecimalPoints(str, dot) {
    str = str.toString();
    str = str.replace(/\D/g, '');
    var inputValue = str.replace(".", '').split("").reverse().join(""); //xoa dau cham dang co va reverse
    var newValue = '';
    for (var i = 0; i < inputValue.length; i++) {
        if (i % dot == 0) {
            newValue += '.';
        }
        newValue += inputValue[i];
    }
    str = newValue.split("").reverse().join("");
    str = str.slice(0, str.length - 1);//xóa dấu chấm bị dư
    return str;
}

//vietnamese, space filter
function locKiTu(str) {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/đ/g, "d");
    str = str.replace(/ /g, "");
    //str = str.replace(/k/g, "nghin");
    return str;
}

//get number from input
function tachSo(chuoi) {
    var so = "0";
    for (var i = 0; i < chuoi.length; i++) {
        //lay so, dau cham, dau phay
        if (chuoi.charCodeAt(i) >= 48 && chuoi.charCodeAt(i) <= 57 || chuoi[i] == ".") {
            so += chuoi[i];
        }
    }
    return parseFloat(so);
}

//get current tab url
var url;
if(chrome.tabs != null){
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        var activeTab = arrayOfTabs[0];
        url = activeTab.url; // or do whatever you need
        //alert(url);
    });
}

function tiGia(chuoi) {
    //alert(chuoi);
    for (var cur = 0; cur < currency.length; cur++) {
        for (var site = 0; site < currency[cur].site.length; site++) {
            if (url.indexOf(currency[cur].site[site]) >= 0) {
                return {"tigia": currency[cur].rate, "tiente": currency[cur].name, "url": currency[cur].site[site]};
            }
        }
        for (var sym = 0; sym < currency[cur].symbols.length; sym++) {
            if (chuoi.indexOf(currency[cur].symbols[sym]) >= 0) {
                return {"tigia": currency[cur].rate, "tiente": currency[cur].name};
            }
        }
    }
    return {"tigia": 1, "tiente": "null", "url": "null"};
}

function get_don_vi_tien_te() {
    var html = '<table class="don-vi-tien-te">';
    html += '<tr><th>Tiền tệ</th><th>Tên ngắn gọn</th></tr>';
    for (var i = 0; i < currency.length; i++) {
        html += '<tr><td>' + currency[i].name + '</td><td>' + currency[i].symbols.join(', ') + '</td></tr>';
    }
    html += '</table>';
    return html;
}

function don_vi_tien_te(command) {
    var container = $('#don-vi-tien-te');
    if (command == 'set') {
        container.html(get_don_vi_tien_te());
        container.removeClass('hidden');
    } else {
        container.html('');
        container.addClass('hidden');
    }
}

/**
 * Set notification
 * @param content
 */
function set_noti(content) {
    $('#notification').html(content);
}

/**
 * Output control
 * @param chuoi
 * @returns {boolean}
 */
function isSuccess(chuoi) {
    // Clear output
    $("#output-container").html('');
    $('#notification').removeClass('update-date');

    // Return notification
    if (chuoi === "" || chuoi.length < 1) {
        set_noti("Hãy quét chọn hoặc gõ ngoại tệ mà bạn muốn đổi.");
        don_vi_tien_te('remove');
        return false;
    }
    //chuoi qua dai
    if (chuoi.length > 20) {
        set_noti("Hãy chọn số tiền ngắn hơn.");
        don_vi_tien_te('remove');
        return false;
    }
    //khong thay don vi tien te
    if (tiGia(chuoi).tiente == "null") {
        set_noti("Hãy chọn đơn vị tiền tệ.");
        don_vi_tien_te('set');
        return false;
    }
    //khong thay so tien
    if (tachSo(chuoi) == "") {
        set_noti("Hãy chọn số tiền.");
        don_vi_tien_te('remove');
        return false;
    }
    set_noti(update_date); // update is global var from currency.json
    $('#notification').addClass('update-date');
    don_vi_tien_te('remove');
    return true;
}

//exchange and return output
function chuyenDoi(chuoi, mode) {
    if (mode == "manual") {
        chuoi = chuoi.value;
    }
    if (mode == "auto") {
        $("#manual_input").val(chuoi);
    }
    chuoi = locKiTu(chuoi);
    if (isSuccess(chuoi)) {
        var input = tachSo(chuoi).toFixed(2).toString() + tiGia(chuoi).tiente;
        var chuoi_processed = (tachSo(chuoi) * tiGia(chuoi).tigia).toFixed(2);

        /*var ti_gia_hien_tai = "<span class='label'>Tỉ giá: 1 " +
            tiGia(chuoi).tiente + " = </span><span class='value'>" +
            tiGia(chuoi).tigia + " VNĐ</span>";
        var chuoi_processed = (tachSo(chuoi)*tiGia(chuoi).tigia).toFixed(2);
        var output = "<span class='label'>" + input + " = </span><span class='value'>" + chuoi_processed + ' VNĐ</span>';
        var rounded = "<span class='label'>Làm tròn là: </span><span class='value'>"+addDecimalPoints(Math.round(chuoi_processed),3)+" VNĐ</span>";
        $("#output").html(output);
        $("#rounded").html(rounded);
        $("#tigia").html(ti_gia_hien_tai);
        if(tiGia(chuoi_processed).url!="null") {
            $("#noti").html("Tự động nhận biết đơn vị tiền tệ dựa trên trang web.<br>"+update);
        }*/

        var output_data = [
            /*{
                slug: 'output',
                label: input + " = ",
                value: chuoi_processed + " VNĐ"
            },
            {
                slug: 'round',
                label: "Làm tròn là: ",
                value: addDecimalPoints(Math.round(chuoi_processed), 3) + " VNĐ"
            },*/
            {
                slug: 'quick-view',
                label: input + " = ",
                value: addDecimalPoints(Math.round(chuoi_processed), 3) + " VNĐ"
            },
            {
                slug: 'ti-gia',
                label: "Tỉ giá: 1 " + tiGia(chuoi).tiente + " = ",
                value: tiGia(chuoi).tigia + " VNĐ"
            }
        ];

        // Render output
        var html = '';
        for (var i = 0; i < output_data.length; i++) {
            html += '<div class="output-row ' + output_data[i].slug + '">';
            html += '<span class="label">' + output_data[i].label + '</span>';
            html += '<span class="value">' + output_data[i].value + '</span></div>';
        }
        $('#output-container').html(html);
    }
}

//listen from selected text
if(chrome.tabs != null){
    chrome.tabs.executeScript({
        code: "window.getSelection().toString();"
    }, function (selection) {
        console.log(selection);
        chuyenDoi(selection[0], 'auto');
    });
}

//listen from manual exchange
document.addEventListener('DOMContentLoaded', documentEvents, false);

function documentEvents() {
    document.getElementById('manual_input').addEventListener('keyup',
        function () {
            chuyenDoi(document.getElementById('manual_input'), 'manual');
        });

    $('body').on('click', 'a', function () {
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });
    // you can add listeners for other objects ( like other buttons ) here
}