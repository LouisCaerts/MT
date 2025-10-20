export const PreferencesAPI = {
    get:     (k)        => window.api.preferences.get(k),
    getAll:  ()         => window.api.preferences.getAll(),
    set:     (k, v)     => window.api.preferences.set(k, v),
    update:  (patch={}) => window.api.preferences.update(patch),
};
