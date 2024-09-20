let sideCalendarDiv;

let periodData = [];

window.addEventListener('load', function () {
	let style = document.createElement('style');
    style.type = 'text/css';
	style.innerHTML = ".periodDay{background-color: pink !important;} .predictedPeriodDay{background-color: mistyrose !important;}}"
	document.getElementsByTagName('head')[0].appendChild(style);
	sideCalendarDiv = document.getElementById("drawerMiniMonthNavigator");

	if (sideCalendarDiv) {
		//add observer to change style if month changes
		var observer = new MutationObserver(monthChange);
		observer.observe(sideCalendarDiv.querySelectorAll("table")[0], 
					{ attributes: true, childList: true, characterData: true });
		//add observer to title to check if the calendar type changes
		var titleObserver = new MutationObserver(typeOfCalendarCheck);
		titleObserver.observe(document.querySelector("title"), 
					{ attributes: true, childList: true, characterData: true });
		typeOfCalendarCheck();
		processSideCalendar();
	}
})

function typeOfCalendarCheck(){
	if(document.title.indexOf("year")>-1){
		//the Calendar is in year view, add the days to the big calendar
		console.log("year");
		const monthDivs = Array.from(document.querySelector('[role="main"]').querySelectorAll('[data-month]'));
		monthDivs.forEach((monthDiv) =>{
			const thisMonth = monthDiv.getAttribute("data-month").substring(0, 6);
			const thisMonthDays = Array.from(monthDiv.querySelectorAll("button"));
			processCalendar(thisMonth, thisMonthDays);
		});
	}
}

function processSideCalendar(){
	//0 and 1 buttons are arrows the others are days
	const days = Array.from(sideCalendarDiv.querySelectorAll("button")).slice(2);
	const thisMonth = sideCalendarDiv.querySelector('[data-month]').getAttribute("data-month").substring(0, 6);
	processCalendar(thisMonth, days);
}

function processCalendar(thisMonth, days){
	//the calendar has days from 2/3 months (current month and days from the previous or next one) 
	//separate these days by locating the 1st day
	
	const thisMonthStart = days.findIndex((element) => element.children[1].innerHTML ==1);
	const nextMonthStart = days.findLastIndex((element) => element.children[1].innerHTML ==1);
	
	const thisMonthDays = days.slice(thisMonthStart,nextMonthStart);
	processMonth(thisMonthDays, thisMonth);
	
	if(thisMonthStart>0){
		//if this months starts at 0 there are no days from the previous month on display
		const pastMonthString = getMonth(thisMonth, -1);
		const pastMonthDays = days.slice(0,thisMonthStart);
		processMonth(pastMonthDays, pastMonthString);
	}
	if(nextMonthStart!=-1){
		//there are days from next month on display
		const nextMonthString = getMonth(thisMonth, 1);
		const nextMonthDays = days.slice(nextMonthStart);
		processMonth(nextMonthDays, nextMonthString);
	}
}

function getMonth(thisMonth, numberOfMonths){
	//get the previous or next month by N
	let year = parseInt(thisMonth.substring(0, 4));
	const month = parseInt(thisMonth.substring(4));
	let resultMonth = month + numberOfMonths;
	if(resultMonth>12){
		year +=  Math.floor(resultMonth/12);
		resultMonth =  resultMonth%12;
	}
	else if(resultMonth==0){
		year -=  1;
		resultMonth =  12;
	}
	return year.toString()+('0' + resultMonth).slice(-2).toString();
}

function processMonth(daysToStyle, thisMonth){
	//load period data from storage
	chrome.storage.sync.get(["periodData"]).then((result) => {	
		if(result.periodData){
			const thisMonthPeriodData = result.periodData.filter(p => ((p.endDate.substring(0,4)+p.endDate.substring(5,7)) == thisMonth || 
														(p.startDate.substring(0,4)+p.startDate.substring(5,7)) == thisMonth));
			if(thisMonthPeriodData.length>0){
				addStyleToDays(daysToStyle, thisMonthPeriodData, "periodDay", thisMonth);
			}
			else{
				//no data for this month, if is current or next month make a prediction
				const now = new Date();
				const currentMonthYear = now.getFullYear().toString()+('0' + (now.getMonth()+1)).slice(-2);
				if(currentMonthYear == thisMonth || getMonth(currentMonthYear, 1) == thisMonth){
					const predicted = predict(result.periodData);
					addStyleToDays(daysToStyle, [predicted], "predictedPeriodDay", thisMonth);
				}
			}
		}
	});
}

function addStyleToDays(daysToStyle, thisMonthPeriodData, className, thisMonth){
	thisMonthPeriodData.forEach((period) => {
		const startDate = period.startDate;
		// check if the start month is different that the current one, which menas that the previous month, the start for this month is 1
		let start = 1;
		if((period.startDate.substring(0,4)+period.startDate.substring(5,7)) == thisMonth){
			//period started on this month, get the day
			start = parseInt(period.startDate.substring(8,10));
		}
		// check if the end month is different that the current one, which menas that the period ended the next month, 
		// the end for this month is 31 (will work for months with less than 31 days also)
		let end = 31;
		if((period.endDate.substring(0,4)+period.endDate.substring(5,7)) == thisMonth){
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

function predict(periodData){
	const length = periodData.length;
	const averageCycle = periodData.reduce((total, next) => total + next.cycleDuration, 0) / (length-1); //length-1 as the last one always has cycleDuration null
	const averageDuration = periodData.reduce((total, next) => total + next.duration, 0) / length-1;
	const lastPeriodStartDate = new Date(periodData[length-1].startDate);
	let predictedStartDate = new Date();
	let predictedEndDate = new Date();
	predictedStartDate.setDate(lastPeriodStartDate.getDate() + averageCycle);
	predictedEndDate.setDate(lastPeriodStartDate.getDate() + averageCycle + averageDuration);
	const predictedPeriod = {startDate: predictedStartDate.toISOString().substring(0,10), endDate: predictedEndDate.toISOString().substring(0,10), duration:averageDuration, cycleDuration: null };
	return predictedPeriod;
}

function monthChange(){
	clearStyle("periodDay");
	clearStyle("predictedPeriodDay");
	processSideCalendar();
}

function clearStyle(className){
	sideCalendarDiv.querySelectorAll("."+className).forEach(
	(element) =>{
		element.classList.remove(className)
	});
}
