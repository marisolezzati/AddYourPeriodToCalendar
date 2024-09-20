let calendarDiv, days ;

let periodData = [];

window.addEventListener('load', function () {
	let style = document.createElement('style');
    style.type = 'text/css';
	style.innerHTML = ".periodDay{background-color: pink !important;} .predictedPeriodDay{background-color: lightpink !important;} .notCurrentMonth{background-color: lightpink !important;}"
	document.getElementsByTagName('head')[0].appendChild(style);
	calendarDiv = document.getElementById("drawerMiniMonthNavigator");
	if (calendarDiv) {
		const buttons = calendarDiv.querySelectorAll("button"); 
		//0 and 1 buttons are arrows the others are days
		days = Array.from(buttons).slice(2);
		//load period data from storage
		chrome.storage.sync.get(["periodData"]).then((result) => {	
			if(result.periodData){
				periodData = result.periodData;
			}
			processCalendar();
		});
		//add observer to change style if month changes
		var observer = new MutationObserver(monthChange);
		observer.observe(calendarDiv.querySelectorAll("table")[0], 
					{ attributes: true, childList: true, characterData: true });
					
	}
})

function processCalendar(){
	//the calendar has days from 2/3 months (current month and days from the previous or next one) 
	//separate these days by locating the 1st day
	const currentMonth = calendarDiv.children[1].getAttribute("data-month").substring(0, 6);
	
	const thisMonthStart = days.findIndex((element) => element.children[1].innerHTML ==1);
	const nextMonthStart = days.findLastIndex((element) => element.children[1].innerHTML ==1);
	
	const thisMonthDays = days.slice(thisMonthStart,nextMonthStart);
	addStyleToDays(thisMonthDays, "periodDay", currentMonth);
	
	if(thisMonthStart>0){
		//if this months starts at 0 there are no days from the previous month on display
		const pastMonthString = getMonth(currentMonth, -1);
		const pastMonthDays = days.slice(0,thisMonthStart);
		addStyleToDays(pastMonthDays, "notCurrentMonth", pastMonthString);
	}
	if(nextMonthStart!=-1){
		//there are days from next month on display
		const nextMonthString = getMonth(currentMonth, 1);
		const nextMonthDays = days.slice(nextMonthStart);
		addStyleToDays(nextMonthDays, "notCurrentMonth", nextMonthString);
	}
}

function getMonth(thisMonth, numberOfMonths){
	//get the previous or next month by N
	const year = parseInt(thisMonth.substring(0, 4));
	const month = parseInt(thisMonth.substring(4));
	let resultMonth = month + numberOfMonths;
	if(resultMonth>12){
		year +=  Math.floor(resultMonth/12);
		resultMonth =  resultMonth%12;
	}
	return year.toString()+('0' + resultMonth).slice(-2).toString();
}

function addStyleToDays(daysToStyle, className, currentMonth){
	const thisMonthPeriodData = periodData.filter(p => ((p.endDate.substring(0,4)+p.endDate.substring(5,7)) == currentMonth || 
												(p.startDate.substring(0,4)+p.startDate.substring(5,7)) == currentMonth));
	if(thisMonthPeriodData){
		thisMonthPeriodData.forEach((period) => {
			const startDate = period.startDate;
			// check if the start month is different that the current one, which menas that the previous month, the start for this month is 1
			let start = 1;
			if((period.startDate.substring(0,4)+period.startDate.substring(5,7)) == currentMonth){
				//period started on this month, get the day
				start = parseInt(period.startDate.substring(8,10));
			}
			// check if the end month is different that the current one, which menas that the period ended the next month, 
			// the end for this month is 31 (will work for months with less than 31 days also)
			let end = 31;
			if((period.endDate.substring(0,4)+period.endDate.substring(5,7)) == currentMonth){
				//period ended on this month, get the day
				end = parseInt(period.endDate.substring(8,10));
			}
			daysToStyle.forEach((element) =>{
				const childrenDiv  = element.children[1];
				const innerHTML = childrenDiv.innerHTML; 
				if(innerHTML && parseInt(innerHTML)>=start && parseInt(innerHTML)<=end){
					element.classList.add(className);
				}
			});
		});
	}
}

function monthChange(){
	clearStyle("periodDay");
	clearStyle("predictedPeriodDay");
	clearStyle("notCurrentMonth");
	processCalendar();
}

function clearStyle(className){
	calendarDiv.querySelectorAll("."+className).forEach(
	(element) =>{
		element.classList.remove(className)
	});
}
