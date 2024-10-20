export const removeTestByNameAndUpdateLocalStorage = (testName) => {
    // Retrieve schedule data from localStorage
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

    // Find the test and mark it as completed
    const test = scheduleData.tests.find(test => test.name === testName);

    if (test) {
        test.completed = true;
    } else {
        console.error('Test not found.');
        return;
    }

    // Save the updated schedule data back to localStorage
    const updatedScheduleDataString = JSON.stringify(scheduleData);
    localStorage.setItem('scheduleData', updatedScheduleDataString);
}

export const completeTrainingTestAndUpdateLocalStorage = (testName) => {
    // Retrieve schedule data from localStorage
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

    // Find the test and mark it as completed
    const test = scheduleData.tests.find(test => test.name === testName);

    if (test) {
        test.trainingCompleted = true;
    } else {
        console.error('Test not found.');
        return;
    }

    // Save the updated schedule data back to localStorage
    const updatedScheduleDataString = JSON.stringify(scheduleData);
    localStorage.setItem('scheduleData', updatedScheduleDataString);
}