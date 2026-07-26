export const USER_ROLES = [
    {
        id: 'public',
        label: 'Public User',
        summary: 'View public dashboards, historical statistics, and analytics.',
        selfRegistration: true,
    },
    {
        id: 'analyst',
        label: 'Analyst User',
        summary: 'Run predictions for underdog, match outcome, and champion forecasting.',
        selfRegistration: true,
    },
    {
        id: 'research',
        label: 'Research User',
        summary: 'Explore detailed player and team performance analytics.',
        selfRegistration: true,
    },
    {
        id: 'admin',
        label: 'Admin',
        summary: 'Manage datasets, ML models, system configuration, and access control.',
        selfRegistration: false,
    },
]

export const SIGNUP_ROLES = USER_ROLES.filter((role) => role.selfRegistration)
