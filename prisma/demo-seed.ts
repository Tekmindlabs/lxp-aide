import { PrismaClient, UserType, Status, EventType, ActivityType, ResourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function createUsers() {
  console.log('Creating demo users...');
  
  // Create or get existing roles
  const roleNames = ['ADMIN', 'TEACHER', 'STUDENT'];
  const roles = await Promise.all(
    roleNames.map(async (name) => {
      const existingRole = await prisma.role.findUnique({
        where: { name }
      });
      
      if (existingRole) {
        return existingRole;
      }
      
      return prisma.role.create({
        data: {
          name,
          description: `${name.charAt(0) + name.slice(1).toLowerCase()} Role`
        }
      });
    })
  );


  // Create users with profiles if they don't exist
  const users = await Promise.all([
    // Admin
    prisma.user.upsert({
      where: { email: 'admin@school.com' },
      update: {},
      create: {
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
    prisma.user.upsert({
      where: { email: 'teacher1@school.com' },
      update: {},
      create: {
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
    prisma.user.upsert({
      where: { email: 'teacher2@school.com' },
      update: {},
      create: {
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
    prisma.user.upsert({
      where: { email: 'student1@school.com' },
      update: {},
      create: {
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
    prisma.user.upsert({
      where: { email: 'student2@school.com' },
      update: {},
      create: {
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

    // Create default knowledge base and workspace
    console.log('Creating default knowledge base and workspace...');
    const defaultKnowledgeBase = await prisma.knowledgeBase.create({
      data: {
      name: 'Default Knowledge Base',
      description: 'Default knowledge base for the workspace',
      vectorCollection: 'default_kb_vectors',
      }
    });

    await prisma.workspace.create({
      data: {
      name: 'Default Workspace',
      description: 'Default workspace for the system',
      isDefault: true,
      knowledgeBaseId: defaultKnowledgeBase.id
      }
    });

    // 1. Create Demo Calendar
    console.log('Creating demo calendar...');
    const calendar = await prisma.calendar.upsert({
      where: {
      name_type: {
        name: '2024-2025 Academic Calendar',
        type: 'PRIMARY'
      }
      },
      update: {},
      create: {
      name: '2024-2025 Academic Calendar',
      description: 'Main academic calendar for 2024-2025',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2025-05-31'),
      type: 'PRIMARY',
      status: Status.ACTIVE,
      isDefault: true,
      visibility: 'ALL',
      metadata: {
        academicYear: '2024-2025',
        semester: 'BOTH',
        terms: 2
      }
      }
    });

    // 2. Create Demo Events
    console.log('Creating demo events...');
    await Promise.all([
      // Academic Events
      prisma.event.create({
      data: {
        title: 'First Day of School',
        description: 'Opening ceremony and first day of classes',
        eventType: EventType.ACADEMIC,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-01'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'HIGH',
        visibility: 'ALL'
      }
      }),
      // Holidays
      prisma.event.create({
      data: {
        title: 'Fall Break',
        description: 'Fall semester break',
        eventType: EventType.HOLIDAY,
        startDate: new Date('2024-10-14'),
        endDate: new Date('2024-10-18'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'MEDIUM',
        visibility: 'ALL'
      }
      }),
      prisma.event.create({
      data: {
        title: 'Winter Break',
        description: 'Winter holiday break',
        eventType: EventType.HOLIDAY,
        startDate: new Date('2024-12-23'),
        endDate: new Date('2025-01-03'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'MEDIUM',
        visibility: 'ALL'
      }
      }),
      prisma.event.create({
      data: {
        title: 'Spring Break',
        description: 'Spring semester break',
        eventType: EventType.HOLIDAY,
        startDate: new Date('2025-03-24'),
        endDate: new Date('2025-03-28'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'MEDIUM',
        visibility: 'ALL'
      }
      }),
      // Exams
      prisma.event.create({
      data: {
        title: 'Fall Midterms',
        description: 'Fall semester midterm examinations',
        eventType: EventType.EXAM,
        startDate: new Date('2024-10-07'),
        endDate: new Date('2024-10-11'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'HIGH',
        visibility: 'ALL'
      }
      }),
      prisma.event.create({
      data: {
        title: 'Fall Finals',
        description: 'Fall semester final examinations',
        eventType: EventType.EXAM,
        startDate: new Date('2024-12-16'),
        endDate: new Date('2024-12-20'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'HIGH',
        visibility: 'ALL'
      }
      }),
      prisma.event.create({
      data: {
        title: 'Spring Midterms',
        description: 'Spring semester midterm examinations',
        eventType: EventType.EXAM,
        startDate: new Date('2025-03-17'),
        endDate: new Date('2025-03-21'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'HIGH',
        visibility: 'ALL'
      }
      }),
      prisma.event.create({
      data: {
        title: 'Spring Finals',
        description: 'Spring semester final examinations',
        eventType: EventType.EXAM,
        startDate: new Date('2025-05-26'),
        endDate: new Date('2025-05-30'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        priority: 'HIGH',
        visibility: 'ALL'
      }
      })
    ]);

    // 3. Create Demo Terms with Grading Periods and Weeks
    console.log('Creating demo terms...');
    const terms = await Promise.all([
      prisma.term.upsert({
      where: {
        name_calendarId: {
        name: 'Fall Semester 2024',
        calendarId: calendar.id
        }
      },
      update: {},
      create: {
        name: 'Fall Semester 2024',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-12-20'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        gradingPeriods: {
        create: [
          {
          name: 'Fall Quarter 1',
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-10-04'),
          weight: 50,
          status: Status.ACTIVE
          },
          {
          name: 'Fall Quarter 2',
          startDate: new Date('2024-10-21'),
          endDate: new Date('2024-12-20'),
          weight: 50,
          status: Status.ACTIVE
          }
        ]
        },
        weeks: {
        create: Array.from({ length: 18 }, (_, i) => ({
          weekNumber: i + 1,
          startDate: new Date(2024, 7, 1 + (i * 7)),
          endDate: new Date(2024, 7, 7 + (i * 7)),
          status: Status.ACTIVE
        }))
        }
      }
      }),
      prisma.term.upsert({
      where: {
        name_calendarId: {
        name: 'Spring Semester 2025',
        calendarId: calendar.id
        }
      },
      update: {},
      create: {
        name: 'Spring Semester 2025',
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-05-30'),
        calendarId: calendar.id,
        status: Status.ACTIVE,
        gradingPeriods: {
        create: [
          {
          name: 'Spring Quarter 1',
          startDate: new Date('2025-01-06'),
          endDate: new Date('2025-03-14'),
          weight: 50,
          status: Status.ACTIVE
          },
          {
          name: 'Spring Quarter 2',
          startDate: new Date('2025-03-31'),
          endDate: new Date('2025-05-30'),
          weight: 50,
          status: Status.ACTIVE
          }
        ]
        },
        weeks: {
        create: Array.from({ length: 18 }, (_, i) => ({
          weekNumber: i + 1,
          startDate: new Date(2025, 0, 6 + (i * 7)),
          endDate: new Date(2025, 0, 12 + (i * 7)),
          status: Status.ACTIVE
        }))
        }
      }
      })
    ]);

    // 4. Create Demo Programs
    console.log('Creating demo programs...');
    const programs = await Promise.all([
      prisma.program.upsert({
      where: { name: 'Elementary Education' },
      update: {},
      create: {
        name: 'Elementary Education',
        description: 'K-6 Elementary Education Program',
        status: Status.ACTIVE,
        calendarId: calendar.id,
      }
      }),
      prisma.program.upsert({
      where: { name: 'Middle School Program' },
      update: {},
      create: {
        name: 'Middle School Program',
        description: 'Grades 7-9 Middle School Education',
        status: Status.ACTIVE,
        calendarId: calendar.id,
      }
      }),
      prisma.program.upsert({
      where: { name: 'High School Program' },
      update: {},
      create: {
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
      prisma.classGroup.upsert({
      where: { 
        name_programId: {
        name: 'Grade 1',
        programId: programs[0].id
        }
      },
      update: {},
      create: {
        name: 'Grade 1',
        description: 'First Grade Classes',
        programId: programs[0].id,
        status: Status.ACTIVE,
      }
      }),
      prisma.classGroup.upsert({
      where: { 
        name_programId: {
        name: 'Grade 7',
        programId: programs[1].id
        }
      },
      update: {},
      create: {
        name: 'Grade 7',
        description: 'Seventh Grade Classes',
        programId: programs[1].id,
        status: Status.ACTIVE,
      }
      }),
      prisma.classGroup.upsert({
      where: { 
        name_programId: {
        name: 'Grade 10',
        programId: programs[2].id
        }
      },
      update: {},
      create: {
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
      prisma.subject.upsert({
      where: { code: 'MATH101' },
      update: {},
      create: {
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Basic Mathematics',
        status: Status.ACTIVE,
        classGroups: {
        connect: [{ id: classGroups[0].id }]
        }
      }
      }),
      prisma.subject.upsert({
      where: { code: 'SCI101' },
      update: {},
      create: {
        name: 'Science',
        code: 'SCI101',
        description: 'General Science',
        status: Status.ACTIVE,
        classGroups: {
        connect: [{ id: classGroups[0].id }]
        }
      }
      }),
      prisma.subject.upsert({
      where: { code: 'ENG101' },
      update: {},
      create: {
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
      prisma.class.upsert({
      where: {
        name_classGroupId: {
        name: 'Grade 1-A',
        classGroupId: classGroups[0].id
        }
      },
      update: {},
      create: {
        name: 'Grade 1-A',
        classGroupId: classGroups[0].id,
        capacity: 30,
        status: Status.ACTIVE,
      }
      }),
      prisma.class.upsert({
      where: {
        name_classGroupId: {
        name: 'Grade 7-A',
        classGroupId: classGroups[1].id
        }
      },
      update: {},
      create: {
        name: 'Grade 7-A',
        classGroupId: classGroups[1].id,
        capacity: 35,
        status: Status.ACTIVE,
      }
      }),
      prisma.class.upsert({
      where: {
        name_classGroupId: {
        name: 'Grade 10-A',
        classGroupId: classGroups[2].id
        }
      },
      update: {},
      create: {
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
      prisma.classroom.upsert({
      where: { name: 'Room 101' },
      update: {
        capacity: 30,
        resources: 'Projector, Whiteboard'
      },
      create: {
        name: 'Room 101',
        capacity: 30,
        resources: 'Projector, Whiteboard'
      }
      }),
      prisma.classroom.upsert({
      where: { name: 'Room 102' },
      update: {
        capacity: 35,
        resources: 'Smart Board, Computers'
      },
      create: {
        name: 'Room 102',
        capacity: 35,
        resources: 'Smart Board, Computers'
      }
      }),
      prisma.classroom.upsert({
      where: { name: 'Science Lab' },
      update: {
        capacity: 25,
        resources: 'Lab Equipment, Safety Gear'
      },
      create: {
        name: 'Science Lab',
        capacity: 25,
        resources: 'Lab Equipment, Safety Gear'
      }
      })
    ]);


    // 9. Create Demo Timetables and Periods
    console.log('Creating timetables and periods...');
    const timetables = await Promise.all(
      classGroups.map(async (classGroup) => {
      return prisma.timetable.upsert({
        where: {
        classGroupId: classGroup.id
        },
        update: {
        termId: terms[0].id
        },
        create: {
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
      students.map((student: { id: string }) =>
        prisma.studentActivity.create({
        data: {
          studentId: student.id,
          activityId: activities[0].id,
          status: 'PENDING' as const
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
