// testUrl = test url in the localStorage configs
export const getConfigs = (testUrl) => {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData'));
    const test = scheduleData?.tests.find((t) => t.testUrl === testUrl);
    if (test) {
        return {
            testId: test.id,
            configs: test.configs,
            trainingConfigs: test.training_configs,
            moduleId: scheduleData.moduleId,
            sessionId: scheduleData.sessionId,
            userId: scheduleData.userId
        };
    } else {
        console.error(`No config found for ${testUrl}`);
        return null;
    }
};

// testKey = naming for your localStorage for store the indexConfigs and indexTrainingConfigs
export const getStoredIndices = (testKey) => {
    const storedIndices = localStorage.getItem(`index-config-${testKey}`);
    return storedIndices ? JSON.parse(storedIndices) : null;
};

export const setStoredIndices = (testKey, indexTrainingConfig, indexConfig) => {
    localStorage.setItem(`index-config-${testKey}`, JSON.stringify({ indexTrainingConfig, indexConfig }));
};

export const getRefreshCount = (testKey) => {
    return parseInt(localStorage.getItem(`refresh-${testKey}`) || '0');
};

export const incrementRefreshCount = (testKey) => {
    const count = getRefreshCount(testKey) + 1;
    localStorage.setItem(`refresh-${testKey}`, count.toString());
    return count;
};

export const clearTestData = (testKey) => {
    localStorage.removeItem(`refresh-${testKey}`);
    localStorage.removeItem(`index-config-${testKey}`);
};

export const getCurrentConfig = (configs, trainingConfigs, indexTrainingConfig, indexConfig) => {
    if (indexTrainingConfig < trainingConfigs.length) {
        return trainingConfigs[indexTrainingConfig];
    } else {
        return configs[indexConfig];
    }
};
