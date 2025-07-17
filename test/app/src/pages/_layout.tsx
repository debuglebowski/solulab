// import '../styles.css';
import 'evalz/styles';

import { Layout } from 'evalz/ui';

export default async function RootLayout(props: React.PropsWithChildren) {
	return <Layout.Root {...props} />;
}

export function getConfig() {
	return { render: 'static' };
}
