import * as React from 'react';
import { PropsWithChildren } from "react";

export function Page(props: PropsWithChildren<{
	name: string
}>) {
	return <div>
		<h1 className="title">{props.name}</h1>
		{props.children}
	</div>;
}