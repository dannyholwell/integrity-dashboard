import { createFinanceService } from './financeService.js';
import { createHealthService } from './healthService.js';
import { createMoodService } from './moodService.js';
import { createTasksService } from './tasksService.js';
export const createDashboardService = (db) => {
    const financeService = createFinanceService(db);
    const healthService = createHealthService(db);
    const moodService = createMoodService(db);
    const tasksService = createTasksService(db);
    const getSummary = () => {
        const finance = financeService.getFinanceOverview();
        const health = healthService.getHealthOverview(7);
        const mood = moodService.getMoodOverview(7);
        const taskSummary = tasksService.getTaskSummary();
        return {
            finance,
            health,
            mood,
            taskSummary,
            nextEvent: {
                title: 'Physiotherapy - Mobility Check',
                location: 'Moonee Ponds Clinic',
                time: '2:30 PM',
                timeLeft: '45 mins',
                type: 'Health',
            },
            insights: [
                {
                    type: 'energy',
                    title: 'Energy/Effort Match',
                    message: `Today's mood (${mood.currentScore}) supports tackling your ${taskSummary.byEffort.high} high-effort task before 11:00 AM.`,
                },
                {
                    type: 'reward',
                    title: 'Reward Seek Trigger',
                    message: `Step count (${health.metrics.steps.toLocaleString()} vs 10k target) suggests keeping discretionary spend intentional tonight.`,
                },
            ],
        };
    };
    return {
        getSummary,
    };
};
