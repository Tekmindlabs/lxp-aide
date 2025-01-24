import { Status } from "@prisma/client";

export interface Student {
	id: string;
	name: string;
	email: string;
	status: Status;
	studentProfile: {
		dateOfBirth: Date;
		class?: {
			name: string;
			classGroup: {
				name: string;
				program: {
					name: string | null;
				};
			};
		};
		parent?: {
			user: {
				name: string;
			};
		};
		attendance: {
			status: string;
		}[];
		activities: {
			status: string;
			grade?: number;
		}[];
	};
}
