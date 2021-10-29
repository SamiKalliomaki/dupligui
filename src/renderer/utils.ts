export type FormErrorState = {
	error: string,
	fieldErrors: { [field in string]: string }
}

export const kClearFormErrorState: FormErrorState = {
	error: '',
	fieldErrors: {}
}

export function toFormErrorState(e: any): FormErrorState {
	if (e instanceof Error) {
		return {
			error: e.message,
			fieldErrors: {}
		}
	}

	if (e instanceof Object && 'formErrors' in e) {
		let formErrors = e.formErrors;

		if (formErrors instanceof Array) {
			let errors: FormErrorState = {
				error: '',
				fieldErrors: {}
			};

			for (let formError of formErrors) {
				let field = formError.field;
				let message = formError.message?.toString() || "Unknown error.";

				if (field && typeof field === 'string') {
					errors.fieldErrors[field] = message;
				} else {
					errors.error = message;
				}
			}
			return errors;
		}
	}

	return {
		error: e?.toString() || "Unknown error.",
		fieldErrors: {}
	};
}