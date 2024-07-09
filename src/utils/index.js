export const removeTestByNameAndUpdateLocalStorage = (testName) => {
    const scheduleDataString = localStorage.getItem('scheduleData');

    if (!scheduleDataString) {
        console.error('No schedule data found in localStorage.');
        return;
    }

    let scheduleData = JSON.parse(scheduleDataString);

    if (!Array.isArray(scheduleData.tests)) {
        console.error('Invalid schedule data format.');
        return;
    }

    scheduleData.tests = scheduleData.tests.filter(test => test.name !== testName);

    const updatedScheduleDataString = JSON.stringify(scheduleData);

    localStorage.setItem('scheduleData', updatedScheduleDataString);

    console.log('Test removed and schedule data updated in localStorage.');
}