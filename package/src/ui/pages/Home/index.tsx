import { Button } from '~shadcn/components/button';

export async function Home() {
	const data = await getData();

	return (
		<div>
			<title>{data.title}</title>

			<h1 className="text-4xl font-bold tracking-tight">
				{data.headline}
			</h1>

			<p>{data.body}</p>

			<Button>Click me</Button>
		</div>
	);
}

const getData = async () => {
	const data = {
		title: 'Waku',
		headline: 'Waku',
		body: 'Hello world!',
	};

	return data;
};

export const getConfig = async () => {
	return { render: 'static' };
};
