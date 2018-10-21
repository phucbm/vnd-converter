/* Copyright 2016 Phucbm */
BMP = {};
jQuery(document).ready(function ($) {
    chrome.identity.getProfileUserInfo(function(userInfo) {
        console.log(userInfo);
    });

    // Define & init variables
    var currency, update_date, message, currentUrl,
        $mess_container = $('#message'),
        $noti_container = $('#notification'),
        $output_container = $('#output-container');

    // Fetch current file from Git
    $.ajax({
        url: "https://raw.githubusercontent.com/phucbm/em-oi-doi-tien/master/core/currency.txt",
        dataType: 'text',
        success: function (data) {
            data = JSON.parse(data);
            currency = data.currency;
            update_date = data.update_date;
        },
        error: function () {
            console.log('Unable to fetch currency data.');
        }
    });

    // Fetch message from Git
    $.ajax({
        url: "https://raw.githubusercontent.com/phucbm/em-oi-doi-tien/master/core/message.txt",
        dataType: 'text',
        success: function (data) {
            message = JSON.parse(data);

            if (message.visibility === 'visible') {
                $mess_container.removeClass('hidden');
                $mess_container.html(message.content);
                console.log(message.content);
            }
        },
        error: function () {
            console.log('Unable to fetch message data.');
        }
    });

    // Add decimal points to number
    BMP.addDecimalPoints = function (str, dot) {
        str = str.toString();
        str = str.replace(/\D/g, '');

        // clear dots if any then reverse
        var inputValue = str.replace(".", '').split("").reverse().join(""),
            newValue = '';

        // loop
        for (var i = 0; i < inputValue.length; i++) {
            if (i % dot === 0) {
                newValue += '.';
            }
            newValue += inputValue[i];
        }
        str = newValue.split("").reverse().join("");

        // clear unwanted dot
        str = str.slice(0, str.length - 1);
        return str;
    };

    //vietnamese, space filter
    BMP.characterFilter = function (str) {
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
    };

    //get number from input
    BMP.numberFilter = function (chuoi) {
        var so = "0";
        for (var i = 0; i < chuoi.length; i++) {
            // only get number digit, dot and colon
            if (chuoi.charCodeAt(i) >= 48 && chuoi.charCodeAt(i) <= 57 || chuoi[i] === ".") {
                so += chuoi[i];
            }
        }
        return parseFloat(so);
    };

    //get current tab url
    if (chrome.tabs != null) {
        chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
            // since only one tab should be active and in the current window at once
            // the return variable should only have one entry
            var activeTab = arrayOfTabs[0];
            currentUrl = activeTab.url; // or do whatever you need
            //alert(url);
        });
    }

    function tiGia(chuoi) {
        //alert(chuoi);
        for (var cur = 0; cur < currency.length; cur++) {
            for (var site = 0; site < currency[cur].site.length; site++) {
                if (currentUrl.indexOf(currency[cur].site[site]) >= 0) {
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
        $noti_container.html(content);
    }

    /**
     * Output control
     * @param chuoi
     * @returns {boolean}
     */
    function isSuccess(chuoi) {
        // Clear output
        $("#output-container").html('');
        $noti_container.removeClass('update-date');

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
        if (tiGia(chuoi).tiente === "null") {
            set_noti("Hãy chọn đơn vị tiền tệ.");
            don_vi_tien_te('set');
            return false;
        }
        //khong thay so tien
        if (BMP.numberFilter(chuoi) === "") {
            set_noti("Hãy chọn số tiền.");
            don_vi_tien_te('remove');
            return false;
        }
        set_noti(update_date); // update is global var from currency.json
        $noti_container.addClass('update-date');
        don_vi_tien_te('remove');
        return true;
    }

    //exchange and return output
    function chuyenDoi(chuoi, mode) {
        if (mode === "manual") {
            chuoi = chuoi.value;
        }
        if (mode === "auto") {
            $("#manual_input").val(chuoi);
        }
        chuoi = BMP.characterFilter(chuoi);
        if (isSuccess(chuoi)) {
            var input = BMP.numberFilter(chuoi).toFixed(2).toString() + tiGia(chuoi).tiente;
            var chuoi_processed = (BMP.numberFilter(chuoi) * tiGia(chuoi).tigia).toFixed(2);

            var output_data = [
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
            $output_container.html(html);
        }
    }

    //listen from selected text
    if (chrome.tabs != null) {
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
});