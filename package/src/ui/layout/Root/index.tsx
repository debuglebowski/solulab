export async function Root(props: React.PropsWithChildren) {
	return (
		<div className="font-['Nunito']">
			<link rel="icon" type="image/png" href="/images/favicon.png" />

			<main
				className="h-dvh w-dvw flex items-center justify-center"
				{...props}
			/>
		</div>
	);
}
