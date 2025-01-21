import { PrismaClient, UserType, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoData() {
  try {
    // 1. Create Demo Programs
    console.log('Creating demo programs...');
    const programs = await Promise.all([
      prisma.program.create({
        data: {
          name: 'Elementary Education',
          description: 'K-6 Elementary Education Program',
          level: 'ELEMENTARY',
          status: Status.ACTIVE,
        }
      }),
      prisma.program.create({
        data: {
          name: 'Middle School Program',
          description: 'Grades 7-9 Middle School Education',
          level: 'MIDDLE',
          status: Status.ACTIVE,
        }
      })
    ]);

    // 2. Create Demo Class Groups
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
      })
    ]);

    // 3. Create Demo Subjects
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
      })
    ]);

    // 4. Create Demo Classes
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
      })
    ]);

    // 5. Create Demo Classrooms
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
      })
    ]);

    // 6. Create Demo Academic Calendar
    console.log('Creating demo academic calendar...');
    const academicYear = await prisma.academicYear.create({
      data: {
        name: '2024-2025',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2025-07-31'),
        status: Status.ACTIVE,
      }
    });

    // 7. Create Demo Terms
    console.log('Creating demo terms...');
    const terms = await Promise.all([
      prisma.term.create({
        data: {
          name: 'First Term',
          startDate: new Date('2024-08-01'),
          endDate: new Date('2024-12-20'),
          academicYearId: academicYear.id,
          status: Status.ACTIVE,
        }
      }),
      prisma.term.create({
        data: {
          name: 'Second Term',
          startDate: new Date('2025-01-06'),
          endDate: new Date('2025-05-31'),
          academicYearId: academicYear.id,
          status: Status.ACTIVE,
        }
      })
    ]);

    // Get an existing teacher
    const teacher = await prisma.user.findFirst({
      where: { userType: UserType.TEACHER },
      include: {
        teacherProfile: true
      }
    });

    if (teacher?.teacherProfile) {
      // 8. Create Teacher-Subject and Teacher-Class relationships
      console.log('Creating teacher assignments...');
      await Promise.all([
        // Assign subjects to teacher
        prisma.teacherSubject.create({
          data: {
            teacherId: teacher.teacherProfile.id,
            subjectId: subjects[0].id,
            status: Status.ACTIVE,
          }
        }),
        prisma.teacherSubject.create({
          data: {
            teacherId: teacher.teacherProfile.id,
            subjectId: subjects[1].id,
            status: Status.ACTIVE,
          }
        }),
        // Assign classes to teacher
        prisma.teacherClass.create({
          data: {
            teacherId: teacher.teacherProfile.id,
            classId: classes[0].id,
            status: Status.ACTIVE,
          }
        })
      ]);

      // 9. Create Demo Timetable and Periods
      console.log('Creating timetable and periods...');
      const timetable = await prisma.timetable.create({
        data: {
          termId: terms[0].id,
          classGroupId: classGroups[0].id,
        }
      });

      await Promise.all([
        prisma.period.create({
          data: {
            startTime: new Date('2024-08-01T08:00:00Z'),
            endTime: new Date('2024-08-01T09:00:00Z'),
            dayOfWeek: 1, // Monday
            subjectId: subjects[0].id,
            classroomId: classrooms[0].id,
            timetableId: timetable.id,
          }
        }),
        prisma.period.create({
          data: {
            startTime: new Date('2024-08-01T09:00:00Z'),
            endTime: new Date('2024-08-01T10:00:00Z'),
            dayOfWeek: 1, // Monday
            subjectId: subjects[1].id,
            classroomId: classrooms[0].id,
            timetableId: timetable.id,
          }
        })
      ]);
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