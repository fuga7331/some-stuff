/*global daysInMonth, thisMonth, thisYear, window*/
var app = (function () {
    /*
    data WorkHour = 
                WorkHour{
                    h :: Int
                    ,m :: Int
                }
    data Entry = 
                ReasonForMissingWork {
                    reason_for_missing_work :: String
                } | 
                WorkDay{
                    start_time :: WorkHour
                    ,end_time :: WorkHour
		    ,comment :: String
                }
    */

    //increments 1 based weekday
    'use strict';
    var work_month,
        hours_precision = 2,
        public_variables = {
            "" : function (e) {console.log(e);},
            set_hours_precision: function(n){ hours_precision = n; },
            set_work_month: set_work_month,
            get_work_month: get_work_month,
            print_workhours_table: print_workhours_table,
            recalc_workhours_table: recalc_workhours_table,
            save_data: save_data,
            load_data: load_data,
            work_day_or_not: work_day_or_not,
            init: init
    };
    function init(tb1,tb2,select1){
        var current_callback = public_variables[select1.value];
	$(document).on("click", function(e){
	    if (e.target.tagName === "TD" && e.target.parentElement.parentElement === tb1) { 
                current_callback(e.target);
	    }
        });
        $(select1).on("change", function (e) {
            console.log(this.value);
	    current_callback = public_variables[this.value];
        });
        print_workhours_table(tb1,tb2);
    }
    function inc_weekday(week_day) {
        return week_day % 7 + 1;
    }
    function to_work_month(one_based_month,
                           year,
                           day_of_the_week_of_the_first_day_in_month,
                           standard_days_off,// optional, default = {6:"friday",7:"saturday"}
                           default_work_day// optional, default = {"start": {"h":8,"m":00},"end": {"h":16,"m":00}}
                           ) {
        var month,
            week_day,
            days_in_month,
            result,
            i,
            key;
        //translating arguments
        month = one_based_month - 1;
        //var year = ;
        week_day = day_of_the_week_of_the_first_day_in_month;
        days_in_month = daysInMonth(month, year);
        //initialize optional arguments with default values
        standard_days_off = standard_days_off || {6: "friday", 7: "saturday"};
        default_work_day = default_work_day || {"start": {"h": 8, "m": 0}, "end": {"h": 16, "m": 0}, "comment": ""};

        result = {};
        i = 1;

        while (i <= days_in_month) {
            key = i + "." + one_based_month + "." + year;
            if (standard_days_off.hasOwnProperty(week_day)) {
                result[key] = {"reason" : standard_days_off[week_day]};
            } else {
                result[key] = default_work_day.clone();
            }
            i += 1;
            week_day = inc_weekday(week_day);
        }
        return result;
    }
    
    function to_workday_row(d, start_hour, start_minute, end_hour, end_minute, comment) {
        var total_minutes_this_day =    (end_hour * 60 + end_minute)  -
                                        (start_hour * 60 + start_minute),
            total_hours_this_day = total_minutes_this_day / 60.0;

        return make_tr([
                    	d.wrapInputValue("work_calendar[]"),
                    	(start_hour + ":" + String(start_minute).padleft("0", 2)).wrapInputValue("strth[]"),
                    	(end_hour   + ":" + String(end_minute).padleft("0", 2)).wrapInputValue("strtm[]"),
                    	total_hours_this_day.toFixed(hours_precision),
                    	(comment || "").wrapInputValue("comment[]")
		    ],
		    row_click_td()
                );
    }
    function row_click_td(){
        return "<td class=\"row_click no_print_display\" >"+
                        "..."
               + "</td>"
    }
    function print_workhours_table(output_table_body_for_hours, output_table_body_for_summary) {
        var result = [{str: "", total_hours: 0, total_days: 0 }].concat(Object.keys(work_month)).reduce(function (result, d) {
            var start_hour,
                start_minute,
                end_hour,
                end_minute,
                total_minutes_this_day,
                total_hours_this_day;
            if (work_month[d].hasOwnProperty("reason")) {
                //days with a reason for absence
                result.str += make_tr([
                                        d.wrapInputValue("work_calendar[]"),
                                        {
					    value: work_month[d].reason.wrapInputValue("reason[]"),
					    attributes: {
				   	  	    colspan: 3
					    }
				        }
				    ],
				    row_click_td() + row_click_td()
				);
            } else {
                //workday
                start_hour             = work_month[d].start.h;
                start_minute           = work_month[d].start.m;
                end_hour               = work_month[d].end.h;
                end_minute             = work_month[d].end.m;
                total_minutes_this_day = (end_hour * 60 + end_minute)  -
                                         (start_hour * 60 + start_minute);
                total_hours_this_day = total_minutes_this_day / 60.0;

                result.total_days += 1;
                result.total_hours += total_hours_this_day;

                result.str += to_workday_row(d, start_hour, start_minute, end_hour, end_minute, work_month[d].comment);

            }
            return result;
        });
        output_table_body_for_hours.innerHTML = result.str;
        output_table_body_for_summary.innerHTML =     "<tr>" +
                                                        "<th>total work hours</th>" +
                                                        "<td>"  +
                                                            String(result.total_hours.toFixed(hours_precision)) +
                                                        "</td>" +
                                                    "</tr>" +
                                                    "<tr>" +
                                                        "<th>total work days</th>" +
                                                        "<td>"  +
                                                            String(result.total_days) +
                                                        "</td>" +
                                                    "</tr>";
    }
    function save_data() {
        window.localStorage.setItem('work_hours_work_month', JSON.stringify(work_month));
    }
    function load_data(output_table_body_for_hours,
                       output_table_body_for_summary) {
        if (window.localStorage.getItem('work_hours_work_month')) {
            work_month = JSON.parse(window.localStorage.getItem('work_hours_work_month'));
            print_workhours_table(output_table_body_for_hours, output_table_body_for_summary);
        } else {
            window.alert("no saved data");
        }
    }


    function parse_time_h_m(time_str) {
        var tmp = time_str.split(":");
        return {"h": parseInt(tmp[0], 10),
                "m": parseInt(tmp[1], 10)
            };
    }
    function workday_row(row) {
        return $(row).children().none( function (index, td) {return td.colSpan === 3;} );
    }
    function getReasonFromTable(row) {
        return row.cells[1].childNodes[0] ? row.cells[1].childNodes[0].value : "";
    }
    function recalc_workhours_table(table_body) {
        //var rows = table_body.rows;
        $(table_body).children("tr").map(function (i, r) {
            //console.log(rows[i].cells[0].childNodes[0].value);
            var work_day = work_month[r.cells[0].childNodes[0].value];
            if (workday_row(r)) {
                //MAYBE_LATER
		work_day.comment = r.cells[4].childNodes[0].value;
                work_day.start = parse_time_h_m(r.cells[1].childNodes[0].value);
                work_day.end = parse_time_h_m(r.cells[2].childNodes[0].value);
                delete work_day.reason;
                //console.log(work_day);//work_day);
            } else {
                //MAYBE_LATER after this becomes an input aswell :
                work_day.reason = getReasonFromTable(this);
                delete work_day.start;
                delete work_day.end;
		delete work_day.comment;
            }
        });
    }
    function non_workday_row(row) {
        return !workday_row(row);
    }
    function work_day_or_not(td) {
        var row = td.parentElement,
            d = row.cells[0].childNodes[0].value;

        if (workday_row(row)) {
            //convert workday row to non workday row
            row.innerHTML = "<td>" +
                                d.wrapInputValue("work_calendar[]")
                            + "</td>" +
                            "<td colspan=\"3\">" +
                                "idk".wrapInputValue("reason[]")
                            + "</td>" + row_click_td() + row_click_td();
        } else {
            row.innerHTML = to_workday_row(d, 8, 0, 14, 0);
        }
    }
    function set_work_month(obj) {
        // TODO verification that obj can actually be a work month, according to the definition at the top of the file
        work_month = obj;
    }
    function get_work_month() {
        // TODO verification that obj can actually be a work month, according to the definition at the top of the file
        return work_month;
    }
    work_month = to_work_month(thisMonth() + 1, thisYear(), 6);
    
    return public_variables;
}());
