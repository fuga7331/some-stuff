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


