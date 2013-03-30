Object.prototype.clone = function(){
		var result = {};
		for(i in this)
			result[i] = this[i];
		return result;
};
String.prototype.dup = function(len){
		var result = "";
		for(;len>0; len--){
			result += this;
		}
		return result;
};
String.prototype.padleft = function(ch,len){
		if(ch.length>1)
			return this;
		if(this.length >= len)
			return this;
		return ch.dup(len - this.length) + this;
};

String.prototype.wrapInputValue = function(name,type){
	name = name || "";
	type = type || "text";
	return '<input name="'+name+'" type="'+type+'" value="'+ this +'">';
};
Object.defineProperty(Object.prototype, "clone", { enumerable: false });
Object.defineProperty(String.prototype, "dup", { enumerable: false });
Object.defineProperty(String.prototype, "padleft", { enumerable: false });
Object.defineProperty(String.prototype, "wrapInputValue", { enumerable: false });

//months are zero based
function daysInMonth(month,year){
	//0th day of the month is of the previous month, so the last day of the month is the 0th day of the next
    return new Date(year, month + 1 , 0).getDate();
}
function thisMonth(){
	return new Date().getMonth();
}
function thisYear(){
	return new Date().getFullYear();
}
function daysThisMonth(){
	return daysInMonth(thisMonth(), thisYear());
}

function make_td(value, attributes){
    return $("<td>").html(value).attr(attributes).toHtml()[0];
}

//td_arr is an array of elements that are either string or {value: ..., attributes: ...}
function make_tr (td_arr, additional_td_html){
    var row,td_string_array;
    td_string_array = $.map(td_arr, function (v, i){
        	if((typeof v) === "string"){
			return "<td>" + v + "</td>";
		} else {
			return make_td(v.value, v.attributes);
		}
	    });
    row = $("<tr>").append(td_string_array).append(additional_td_html);
    return row.toHtml()[0];
}

// takes a binary predicate and returns the negated predicate
function notPred ( pred ) {
	return function () {
		return ! pred.apply(this, arguments);
	}
}
$.fn.all = function ( pred ) {
	return ! this.is( function (k, v) { return ! pred(k, v);});
}
$.fn.any = function ( pred ) {
	return this.is( pred );
}

$.fn.none = notPred($.fn.any);

$.fn.toHtml = function () {
	return this.map(function (index, element) {return $("<div>").append(element).html()});
};


//TODO handle colspan
function tr2obj (tr) {
	var keys = $("th",$(tr).parent().parent()).mapFn("html"),
	    values = $(tr).children().mapFn("html"),
	    result = {};
	keys.map(function (i){
		result[keys[i]] = values[i];
	});
	return result;
}

function rightShiftParams(func, amount){
	amount = amount || 1;
	return function (firstParam){
		return func.apply(this,Array.prototype.slice.call(arguments,amount));
	}
}

$.fn.mapFn = function (methodName) {
	var args = Array.prototype.slice.call(arguments,1);
	return this.map(function (i,v) {
		return $(v)[methodName].apply($(v), args);
	});
}

$.fn.tr2obj = function () {
	return this.map( rightShiftParams(tr2obj));
}
