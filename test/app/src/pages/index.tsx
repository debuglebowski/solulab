import { Pages } from 'evalz/ui';

export default async function HomePage() {
	return <Pages.Home />;
}

export function getConfig() {
	return { render: 'dynamic' };
}
