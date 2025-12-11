export const PreferencesAPI = {
    get:     (k)        => window.api.preferences.get(k),
    getAll:  ()         => window.api.preferences.getAll(),
    set:     (k, v)     => window.api.preferences.set(k, v),
    update:  (patch={}) => window.api.preferences.update(patch),
};

export const DaysAPI = {
    ensure:   ({ date, goal_min }) => window.days.ensure({ date, goal_min }),
    addFocus: ({ date, minutes })  => window.days.addFocus({ date, minutes }),
    list:     ()                   => window.days.list(),
    setGoal:  ({ date, goal_min }) => window.days.setGoal({ date, goal_min }),
};

export const SurveysAPI = {
    get:     (k)        => window.api.surveys.get(k),
    getAll:  ()         => window.api.surveys.getAll(),
    set:     (k, v)     => window.api.surveys.set(k, v),
    update:  (patch={}) => window.api.surveys.update(patch),
}

export const DailyAPI = {
    get:     (k)        => window.daily.get(k),
    getAll:  ()         => window.daily.getAll(),
    set:     (k, v)     => window.daily.set(k, v),
    update:  (patch={}) => window.daily.update(patch),
};