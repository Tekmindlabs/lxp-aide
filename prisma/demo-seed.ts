import { PrismaClient, UserType, Status, EventType, ActivityType, ResourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function createUsers() {
  console.log('Creating demo users...');
  
  // Create roles first
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'System Administrator'
      }
    }),
    prisma.role.create({
      data: {
        name: 'TEACHER',
        description: 'School Teacher'
      }
    }),
    prisma.role.create({
      data: {
        name: 'STUDENT',
        description: 'Student'
      }
    })
  ]);

  // Create users with profiles
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@school.com',
        userType: UserType.ADMIN,
        status: Status.ACTIVE,
        userRoles: {
          create: {
            roleId: roles[0].id
          }
        }
      }
    }),
    // Teachers
    prisma.user.create({
      data: {
        name: 'John Teacher',
        email: 'teacher1@school.com',
        userType: UserType.TEACHER,
        status: Status.ACTIVE,
        teacherProfile: {
          create: {
            specialization: 'Mathematics'
          }
        },
        userRoles: {
          create: {
            roleId: roles[1].id
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        name: 'Jane Teacher',
        email: 'teacher2@school.com',
        userType: UserType.TEACHER,
        status: Status.ACTIVE,
        teacherProfile: {
          create: {
            specialization: 'Science'
          }
        },
        userRoles: {
          create: {
            roleId: roles[1].id
          }
        }
      }
    }),
    // Students
    prisma.user.create({
      data: {
        name: 'Student One',
        email: 'student1@school.com',
        userType: UserType.STUDENT,
        status: Status.ACTIVE,
        studentProfile: {
          create: {
            dateOfBirth: new Date('2010-01-01')
          }
        },
        userRoles: {
          create: {
            roleId: roles[2].id
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        name: 'Student Two',
        email: 'student2@school.com',
        userType: UserType.STUDENT,
        status: Status.ACTIVE,
        studentProfile: {
          create: {
            dateOfBirth: new Date('2010-06-15')
          }
        },
        userRoles: {
          create: {
            roleId: roles[2].id
          }
        }
      }
    })
  ]);

  return users;
}

async function seedDemoData() {
  try {
    // Create users first
    await createUsers();

    // 1. Create Demo Calendar
    console.log('Creating demo calendar...');
    const calendar = await prisma.calendar.create({
      data: {
        name: '2024-2025 Academic Calendar',
        description: 'Main academic calendar for 2024-2025',
        status: Status.ACTIVE,
      }
    });

    // 2. Create Demo Events
    console.log('Creating demo events...');
    await Promise.all([
      prisma.event.create({
        data: {
          title: 'First Day of School',
          description: 'Opening ceremony and first day of classes',
          eventType: EventType.ACADEMIC,
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-08-01'),
          calendarId: calendar.id,
          status: Status.ACTIVE,
        }
      }),
      prisma.event.create({
        data: {
          title: 'Winter Break',
          description: 'Winter holiday break',
          eventType: EventType.HOLIDAY,
          startDate: new Date('2024-12-20'),
          endDate: new Date('2025-01-05'),
          calendarId: calendar.id,
          status: Status.ACTIVE,
        }
      }),
      prisma.event.create({
        data: {
          title: 'Midterm Exams',
          description: 'First semester midterm examinations',
          eventType: EventType.EXAM,
          startDate: new Date('2024-10-15'),
          endDate: new Date('2024-10-25'),
          calendarId: calendar.id,
          status: Status.ACTIVE,
        }
      })
    ]);

    // 3. Create Demo Terms
    console.log('Creating demo terms...');
    const terms = await Promise.all([
      prisma.term.create({
        data: {
          name: 'Fall Semester 2024',
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-12-20'),
          calendarId: calendar.id,
          status: Status.ACTIVE,
        }
      }),
      prisma.term.create({
        data: {
          name: 'Spring Semester 2025',
          startDate: new Date('2025-01-06'),
          endDate: new Date('2025-05-31'),
          calendarId: calendar.id,
          status: Status.ACTIVE,
        }
      })
    ]);

    // 4. Create Demo Programs
    console.log('Creating demo programs...');
    const programs = await Promise.all([
      prisma.program.create({
        data: {
          name: 'Elementary Education',
          description: 'K-6 Elementary Education Program',
          status: Status.ACTIVE,
          calendarId: calendar.id,
        }
      }),
      prisma.program.create({
        data: {
          name: 'Middle School Program',
          description: 'Grades 7-9 Middle School Education',
          status: Status.ACTIVE,
          calendarId: calendar.id,
        }
      }),
      prisma.program.create({
        data: {
          name: 'High School Program',
          description: 'Grades 10-12 High School Education',
          status: Status.ACTIVE,
          calendarId: calendar.id,
        }
      })
    ]);

    // 5. Create Demo Class Groups
    console.log('Creating demo class groups...');
    const classGroups = await Promise.all([
      prisma.classGroup.create({
        data: {
          name: 'Grade 1',
          description: 'First Grade Classes',
          programId: programs[0].id,
          status: Status.ACTIVE,
        }
      }),
      prisma.classGroup.create({
        data: {
          name: 'Grade 7',
          description: 'Seventh Grade Classes',
          programId: programs[1].id,
          status: Status.ACTIVE,
        }
      }),
      prisma.classGroup.create({
        data: {
          name: 'Grade 10',
          description: 'Tenth Grade Classes',
          programId: programs[2].id,
          status: Status.ACTIVE,
        }
      })
    ]);

    // 6. Create Demo Subjects
    console.log('Creating demo subjects...');
    const subjects = await Promise.all([
      prisma.subject.create({
        data: {
          name: 'Mathematics',
          code: 'MATH101',
          description: 'Basic Mathematics',
          status: Status.ACTIVE,
          classGroups: {
            connect: [{ id: classGroups[0].id }]
          }
        }
      }),
      prisma.subject.create({
        data: {
          name: 'Science',
          code: 'SCI101',
          description: 'General Science',
          status: Status.ACTIVE,
          classGroups: {
            connect: [{ id: classGroups[0].id }]
          }
        }
      }),
      prisma.subject.create({
        data: {
          name: 'English',
          code: 'ENG101',
          description: 'English Language Arts',
          status: Status.ACTIVE,
          classGroups: {
            connect: [{ id: classGroups[0].id }]
          }
        }
      })
    ]);

    // 7. Create Demo Classes
    console.log('Creating demo classes...');
    const classes = await Promise.all([
      prisma.class.create({
        data: {
          name: 'Grade 1-A',
          classGroupId: classGroups[0].id,
          capacity: 30,
          status: Status.ACTIVE,
        }
      }),
      prisma.class.create({
        data: {
          name: 'Grade 7-A',
          classGroupId: classGroups[1].id,
          capacity: 35,
          status: Status.ACTIVE,
        }
      }),
      prisma.class.create({
        data: {
          name: 'Grade 10-A',
          classGroupId: classGroups[2].id,
          capacity: 35,
          status: Status.ACTIVE,
        }
      })
    ]);

    // 8. Create Demo Classrooms
    console.log('Creating demo classrooms...');
    const classrooms = await Promise.all([
      prisma.classroom.create({
        data: {
          name: 'Room 101',
          capacity: 30,
          resources: 'Projector, Whiteboard',
        }
      }),
      prisma.classroom.create({
        data: {
          name: 'Room 102',
          capacity: 35,
          resources: 'Smart Board, Computers',
        }
      }),
      prisma.classroom.create({
        data: {
          name: 'Science Lab',
          capacity: 25,
          resources: 'Lab Equipment, Safety Gear',
        }
      })
    ]);

    // 9. Create Demo Timetables and Periods
    console.log('Creating timetables and periods...');
    const timetables = await Promise.all(
      classGroups.map(async (classGroup) => {
        return prisma.timetable.create({
          data: {
            termId: terms[0].id,
            classGroupId: classGroup.id,
          }
        });
      })
    );

    // Create periods for each timetable
    for (const timetable of timetables) {
      await Promise.all([
        prisma.period.create({
          data: {
            startTime: new Date('2024-08-01T08:00:00Z'),
            endTime: new Date('2024-08-01T09:00:00Z'),
            dayOfWeek: 1,
            subjectId: subjects[0].id,
            classroomId: classrooms[0].id,
            timetableId: timetable.id,
          }
        }),
        prisma.period.create({
          data: {
            startTime: new Date('2024-08-01T09:00:00Z'),
            endTime: new Date('2024-08-01T10:00:00Z'),
            dayOfWeek: 1,
            subjectId: subjects[1].id,
            classroomId: classrooms[1].id,
            timetableId: timetable.id,
          }
        }),
        prisma.period.create({
          data: {
            startTime: new Date('2024-08-01T10:00:00Z'),
            endTime: new Date('2024-08-01T11:00:00Z'),
            dayOfWeek: 1,
            subjectId: subjects[2].id,
            classroomId: classrooms[2].id,
            timetableId: timetable.id,
          }
        })
      ]);
    }

    // Create Class Activities
    console.log('Creating demo class activities...');
    const activities = await Promise.all([
      prisma.classActivity.create({
      data: {
        title: 'Math Quiz 1',
        description: 'First quarter math assessment',
        type: ActivityType.QUIZ,
        classId: classes[0].id,
        deadline: new Date('2024-09-15'),
        gradingCriteria: 'Multiple choice assessment',
        resources: {
        create: {
          title: 'Quiz Instructions',
          type: ResourceType.DOCUMENT,
          url: 'https://example.com/quiz1.pdf'
        }
        }
      }
      }),
      prisma.classActivity.create({
      data: {
        title: 'Science Project',
        description: 'Group research project',
        type: ActivityType.PROJECT,
        classId: classes[0].id,
        deadline: new Date('2024-10-30'),
        gradingCriteria: 'Project rubric',
        resources: {
        create: [
          {
          title: 'Project Guidelines',
          type: ResourceType.DOCUMENT,
          url: 'https://example.com/project-guide.pdf'
          },
          {
          title: 'Reference Material',
          type: ResourceType.LINK,
          url: 'https://example.com/references'
          }
        ]
        }
      }
      })
    ]);

    // Add teacher assignments
    const teachers = await prisma.teacherProfile.findMany();
    if (teachers.length > 0) {
      console.log('Creating teacher assignments...');
      await Promise.all([
      prisma.teacherSubject.create({
        data: {
        teacherId: teachers[0].id,
        subjectId: subjects[0].id,
        status: Status.ACTIVE
        }
      }),
      prisma.teacherClass.create({
        data: {
        teacherId: teachers[0].id,
        classId: classes[0].id,
        status: Status.ACTIVE
        }
      })
      ]);
    }

    // Add student assignments
    const students = await prisma.studentProfile.findMany();
    if (students.length > 0) {
      console.log('Creating student assignments...');
      await Promise.all(
      students.map(student =>
        prisma.studentActivity.create({
        data: {
          studentId: student.id,
          activityId: activities[0].id,
          status: 'PENDING'
        }
        })
      )
      );
    }

    console.log('Demo data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

seedDemoData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });