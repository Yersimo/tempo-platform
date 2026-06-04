export const showExperimentBenches = process.env.NEXT_PUBLIC_SHOW_EXPERIMENT_BENCHES === 'true'
export const showExperienceReviewSurfaces = showExperimentBenches || process.env.NEXT_PUBLIC_SHOW_EXPERIENCE_REVIEW_SURFACES === 'true'
