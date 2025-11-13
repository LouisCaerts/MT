import Store from 'electron-store';

const preferences = new Store({
    name: 'preferences',
    clearInvalidConfig: true,
    schema: {
        monGoal: {
            type: 'number',
            default: 120,
            minimum: 0,
            maximum: 1440
        },
        tueGoal: {
            type: 'number',
            default: 120,
            minimum: 0,
            maximum: 1440
        },
        wedGoal: {
            type: 'number',
            default: 120,
            minimum: 0,
            maximum: 1440
        },
        thuGoal: {
            type: 'number',
            default: 120,
            minimum: 0,
            maximum: 1440
        },
        friGoal: {
            type: 'number',
            default: 120,
            minimum: 0,
            maximum: 1440
        },
        satGoal: {
            type: 'number',
            default: 120,
            minimum: 0,
            maximum: 1440
        },
        sunGoal: {
            type: 'number',
            default: 120,
            minimum: 0,
            maximum: 1440
        },
        sessionLength: {
            type: 'number',
            default: 30,
            minimum: 1,
            maximum: 599
        }
    }
});

export default preferences;
