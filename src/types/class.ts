import { Status } from "@prisma/client";

export interface Class {
    id: string;
    name: string;
    capacity: number;
    status: Status;
    classGroup: {
        name: string;
        program: {
            name: string;
        };
    };
    students: { id: string }[];
    teachers: {
        teacher: {
            user: {
                name: string;
            };
        };
    }[];
}