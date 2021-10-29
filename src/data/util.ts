
export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>;
};

export const kDuplicacyDir = '.duplicacy';
export const kPrettyWriteIndent = 2;
