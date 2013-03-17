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
                }
    */

    //increments 1 based weekday
    'use strict';
    var work_month;
    var hours_precision = 2;
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
        default_work_day = default_work_day || {"start": {"h": 8, "m": 0}, "end": {"h": 16, "m": 0}};

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
    function to_workday_row(d, start_hour, start_minute, end_hour, end_minute) {
        var total_minutes_this_day =    (end_hour * 60 + end_minute)  -
                                        (start_hour * 60 + start_minute),
            total_hours_this_day = total_minutes_this_day / 60.0;

        return "<tr>" +
                    "<td>" +
                        d.wrapInputValue("work_calendar[]")
                    + "</td>" +
                    "<td>" +
                        (start_hour + ":" + String(start_minute).padleft("0", 2)).wrapInputValue("strth[]")
                    + "</td>" +
                    "<td>"  +
                        (end_hour   + ":" + String(end_minute).padleft("0", 2)).wrapInputValue("strtm[]")
                    + "</td>" +
                    "<td>"  +
                        total_hours_this_day.toFixed(hours_precision)
                    + "</td>" +
                    "<td class=\"no_print_display\" onclick=\"app.work_day_or_not(this)\">" +
                        "workday/not"
                    + "</td>" +
                "</tr>";
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
                result.str +=     "<tr>" +
                                "<td>" +
                                    d.wrapInputValue("work_calendar[]")
                                + "</td>" +
                                "<td colspan=\"3\">" +
                                    work_month[d].reason.wrapInputValue("reason[]")
                                + "</td>" +
                                "<td class=\"no_print_display\" onclick=\"app.work_day_or_not(this)\">" +
                                    "workday/not"
                                + "</td>" +
                            "</tr>";
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

                result.str += to_workday_row(d, start_hour, start_minute, end_hour, end_minute);

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
        return row.cells.length === 5;
    }
    function getReasonFromTable(table_rows, row_index) {
        return table_rows[row_index].cells[1].childNodes[0].value;
    }
    function recalc_workhours_table(table_body) {
        var rows = table_body.rows;
        rows.forEach = Array.prototype.forEach;
        rows.forEach(function (r, i, rows) {
            //console.log(rows[i].cells[0].childNodes[0].value);
            var work_day = work_month[r.cells[0].childNodes[0].value];
            if (workday_row(r)) {
                //MAYBE_LATER
                work_day.start = parse_time_h_m(r.cells[1].childNodes[0].value);
                work_day.end = parse_time_h_m(r.cells[2].childNodes[0].value);
                delete work_day.reason;
                //console.log(work_day);//work_day);
            } else {
                //MAYBE_LATER after this becomes an input aswell :
                work_day.reason = getReasonFromTable(rows, i);
                delete work_day.start;
                delete work_day.end;
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
            //convert non workday row to workday row
            row.innerHTML = "<td>" +
                                d.wrapInputValue("work_calendar[]")
                            + "</td>" +
                            "<td colspan=\"3\">" +
                                "idk".wrapInputValue("reason[]")
                            + "</td>" +
                            "<td class=\"no_print_display\" onclick=\"app.work_day_or_not(this)\">" +
                                    "workday/not"
                            + "</td>";
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
    return {
	set_hours_precision: function(n){ hours_precision = n; },
        set_work_month: set_work_month,
        get_work_month: get_work_month,
        print_workhours_table: print_workhours_table,
        recalc_workhours_table: recalc_workhours_table,
        save_data: save_data,
        load_data: load_data,
        work_day_or_not: work_day_or_not
    };
}());