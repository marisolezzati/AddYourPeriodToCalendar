function save(){
	chrome.storage.sync.get(["periodData"]).then((result) => {	
		let periodData = [];
		if(result.periodData){
			periodData = result.periodData;
		}
		//TODO add validation
		const startDate = document.getElementById("start").value;
		const endDate = document.getElementById("end").value;
		const duration = getDateDiffInDays(endDate, startDate);
		const period = {startDate: startDate, endDate: endDate, duration:duration, cycleDuration: null };
		periodData.push(period);
		//sort array sinde the added period might not be the last
		let sortedPeriodData = periodData.sort(function (a, b){
			return new Date(a.startDate) - new Date(b.startDate);
		});
		//calculate cycle duration based on the new period (a new period chagnes the duration of the previous cycle)
		const thisPeriodIndex = sortedPeriodData.indexOf(period);
		if(sortedPeriodData[thisPeriodIndex-1]){
			//there is a previous cycle, calculate its duration
			const previousPeriodStartDate = sortedPeriodData[thisPeriodIndex-1].startDate;
			sortedPeriodData[thisPeriodIndex-1].cycleDuration =  getDateDiffInDays(startDate, previousPeriodStartDate);
		}
		if(sortedPeriodData[thisPeriodIndex+1]){
			//there is a next cycle, calculate THIS cycle duration
			const nextPeriodStartDate = sortedPeriodData[thisPeriodIndex+1].startDate;
			sortedPeriodData[thisPeriodIndex].cycleDuration =  getDateDiffInDays(nextPeriodStartDate, startDate);
		}
		chrome.storage.sync.set({"periodData": sortedPeriodData}).then(function(){
			loadPeriods();
		});
	});
}

function getDateDiffInDays(endDate, startDate){
	return Math.floor((new Date(endDate) - new Date(startDate)) /  (1000*60*60*24))
}

function loadPeriods(){
	chrome.storage.sync.get(["periodData"]).then((result) => {	
		let periodData = [];
		if(result.periodData){
			periodData = result.periodData;
		}
		document.getElementById("list").innerHTML = "";
		periodData.forEach((element) =>{
			const div = document.createElement("div");
			div.innerHTML = "From: "+element.startDate+" to "+element.endDate;
			document.getElementById("list").appendChild(div);
			const removeButton = document.createElement("button");
			removeButton.innerHTML = "Delete";
			removeButton.value = element.startDate;
			removeButton.addEventListener('click', remove);
			div.appendChild(removeButton);
		}); 
	});
}

window.onload = function() {
	document.getElementById("save").addEventListener("click", save);
	loadPeriods();  
};

function remove() {
	chrome.storage.sync.get(["periodData"]).then((result) => {	
		const elementToRemove = result.periodData.find(p => (p.startDate == this.value));
		//calculate cycle duration based on the new period (a new period chagnes the duration of the previous cycle)
		const elementToRemoveIndex = result.periodData.indexOf(elementToRemove);
		if(result.periodData[elementToRemoveIndex-1]){
			//there is a previous cycle, calculate its new duration
			result.periodData[elementToRemoveIndex-1].cycleDuration +=  elementToRemove.cycleDuration;
		}
		result.periodData = result.periodData.filter(p => (p.startDate != this.value));
		chrome.storage.sync.set({"periodData": result.periodData}).then(function(){
			loadPeriods();
		});
	});
}