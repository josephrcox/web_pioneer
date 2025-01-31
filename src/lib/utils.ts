import {
	JOB_TYPE,
	PROJECT_NAME,
	type project,
	type website,
} from './objects/types';
import { projects } from './objects/projects';

export function numberToMoney(number: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(number);
}

export function numberWithCommas(number: number) {
	return number.toLocaleString('en-US');
}

export function getJobColor(job: JOB_TYPE) {
	let color = 'bg-white';
	switch (job) {
		case JOB_TYPE.GROWTH:
			color = 'bg-green-700';
			break;
		case JOB_TYPE.DESIGN:
			color = 'bg-blue-700';
			break;
		case JOB_TYPE.ENGINEERING:
			color = 'bg-yellow-700';
			break;
		case JOB_TYPE.PRODUCT:
			color = 'bg-red-700';
			break;
	}
	return color;
}

const commonFirstNames = [
	// Male names
	'Michael',
	'Christopher',
	'Matthew',
	'Joshua',
	'Andrew',
	'Daniel',
	'Joseph',
	'William',
	'Ryan',
	'David',
	// Female names
	'Jessica',
	'Ashley',
	'Jennifer',
	'Sarah',
	'Stephanie',
	'Nicole',
	'Elizabeth',
	'Rachel',
	'Megan',
	'Amanda',
];

const commonLastNames = [
	'Smith',
	'Johnson',
	'Williams',
	'Brown',
	'Jones',
	'Garcia',
	'Miller',
	'Davis',
	'Rodriguez',
	'Martinez',
	'Hernandez',
	'Lopez',
	'Gonzalez',
	'Wilson',
	'Anderson',
	'Thomas',
	'Taylor',
	'Moore',
	'Jackson',
	'Martin',
];

export function generateEmployeeName() {
	const randomFirstName =
		commonFirstNames[Math.floor(Math.random() * commonFirstNames.length)];
	const randomLastName =
		commonLastNames[Math.floor(Math.random() * commonLastNames.length)];
	return `${randomFirstName} ${randomLastName}`;
}

export function getAvailableProjects(website: website): project[] {
	// Get list of completed project names from the website's projects
	const completedProjectNames = new Set(
		website.projects.filter((pr) => pr.completed).map((pr) => pr.project.name),
	);

	// Filter available projects based on dependencies
	return projects.filter((project: project) => {
		// If project has no dependencies, it's available
		if (!project.dependencies) return true;

		// Check if all dependencies are completed
		return project.dependencies.every((dep: PROJECT_NAME) =>
			completedProjectNames.has(dep),
		);
	});
}
