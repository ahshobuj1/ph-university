import httpStatus from 'http-status';
import { AppError } from '../../errors/AppError';
import { SemesterRegistrationModel } from '../SemesterRegistration/semesterRegistration.model';
import { TOfferedCourse } from './offeredCourse.interface';
import { OfferedCourseModel } from './offeredCourse.model';
import { AcademicFacultyModel } from '../academicFaculty/academicFaculty.model';
import { FacultyModel } from '../faculty/faculty.model';
import { CourseModel } from '../Course/course.model';
import { DepartmentModel } from '../department/department.model';
import { hasTimeConflict } from './offeredCourse.utils';
import QueryBuilder from '../../builder/QueryBuilder';

const createOfferedCourse = async (payload: TOfferedCourse) => {
  const {
    semesterRegistration,
    academicFaculty,
    department,
    course,
    faculty,
    section,
    days,
    startTime,
    endTime,
  } = payload;

  // check is semesterRegistration exits
  const isSemesterRegistrationExits =
    await SemesterRegistrationModel.findById(semesterRegistration);

  if (!isSemesterRegistrationExits) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Semester Registration is not found',
    );
  }

  // add semester ObjectId from semester registration
  payload.semester = isSemesterRegistrationExits?.semester;

  // check is academicFaculty exits
  const isAcademicFacultyExits =
    await AcademicFacultyModel.findById(academicFaculty);
  if (!isAcademicFacultyExits) {
    throw new AppError(httpStatus.NOT_FOUND, 'Academic Faculty is not found');
  }

  // check is department exits
  const isDepartmentExits = await DepartmentModel.findById(department);
  if (!isDepartmentExits) {
    throw new AppError(httpStatus.NOT_FOUND, 'Department is not found');
  }

  // check is course exits
  const isCourseExits = await CourseModel.findById(course);
  if (!isCourseExits) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course is not found');
  }

  // check is course exits
  const isFacultyExits = await FacultyModel.findById(faculty);
  if (!isFacultyExits) {
    throw new AppError(httpStatus.NOT_FOUND, 'Faculty is not found');
  }

  // check is department belongs to academicFaculty
  const isDepartmentMatched = await DepartmentModel.findOne({
    _id: department,
    academicFaculty,
  });

  if (!isDepartmentMatched) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This ${isDepartmentExits.name} is not belongs to the ${isAcademicFacultyExits.name}`,
    );
  }

  // check is section already exists with same Semester Registration
  const isSectionAlreadyExists = await OfferedCourseModel.findOne({
    semesterRegistration,
    course,
    section,
  });

  if (isSectionAlreadyExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Offered course with same section already exists',
    );
  }

  // get schedule of the faculties
  const assignSchedules = await OfferedCourseModel.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  }).select('section days startTime endTime');

  const newSchedules = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignSchedules, newSchedules)) {
    throw new AppError(
      httpStatus.CONFLICT,
      'The faculty is not available at that time! please chose another time or days.',
    );
  }

  const result = await OfferedCourseModel.create(payload);
  return result;
};

const getAllOfferedCourse = async (query: Record<string, unknown>) => {
  const offeredCourseQuery = new QueryBuilder(
    OfferedCourseModel.find()
      .populate('semesterRegistration')
      .populate('semester')
      .populate('academicFaculty')
      .populate('department')
      .populate('faculty')
      .populate('course'),

    query,
  )
    .filter()
    .sort()
    .pagination()
    .fields();

  const result = await offeredCourseQuery.modelQuery;
  return result;
};

const getSingleOfferedCourse = async (id: string) => {
  const result = await OfferedCourseModel.findById(id)
    .populate('semesterRegistration')
    .populate('semester')
    .populate('academicFaculty')
    .populate('department')
    .populate('faculty')
    .populate('course');

  return result;
};

const updateOfferedCourse = async (
  id: string,
  payload: Pick<
    TOfferedCourse,
    'faculty' | 'maxCapacity' | 'days' | 'startTime' | 'endTime'
  >,
) => {
  const { faculty, days, startTime, endTime } = payload;

  // check is offered course exits
  const isOfferedCourseExits = await OfferedCourseModel.findById(id);

  if (!isOfferedCourseExits) {
    throw new AppError(httpStatus.NOT_FOUND, 'Offered Course is not found');
  }

  // check is course exits
  const isFacultyExits = await FacultyModel.findById(faculty);
  if (!isFacultyExits) {
    throw new AppError(httpStatus.NOT_FOUND, 'Faculty is not found');
  }

  // get semesterRegistration ID
  const semesterRegistration = isOfferedCourseExits.semesterRegistration;

  // Checking the status of the semester registration: Only accept UPCOMING
  const semesterRegistrationStatus =
    await SemesterRegistrationModel.findById(semesterRegistration);

  if (semesterRegistrationStatus?.status !== 'UPCOMING') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `You can not update this offered course as it is ${semesterRegistrationStatus?.status}`,
    );
  }

  // get schedule of the faculties
  const assignSchedules = await OfferedCourseModel.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  }).select('days startTime endTime');

  const newSchedules = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignSchedules, newSchedules)) {
    throw new AppError(
      httpStatus.CONFLICT,
      'The faculty is not available at that time! please chose another time or days.',
    );
  }

  const result = await OfferedCourseModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

const deleteOfferedCourse = async (id: string) => {
  // 1-> check if the offered course is exists
  // 2-> check if the semester registration is UPCOMING
  // 3-> now delete the offered course

  // check is offered course exits
  const isOfferedCourseExits = await OfferedCourseModel.findById(id);

  if (!isOfferedCourseExits) {
    throw new AppError(httpStatus.NOT_FOUND, 'Offered Course is not found');
  }

  const semesterRegistration = isOfferedCourseExits.semesterRegistration;

  // Checking the status of the semester registration: Only accept UPCOMING
  const semesterRegistrationStatus =
    await SemesterRegistrationModel.findById(semesterRegistration);

  if (semesterRegistrationStatus?.status !== 'UPCOMING') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `You can not delete this offered course as it is ${semesterRegistrationStatus?.status}`,
    );
  }

  const result = await OfferedCourseModel.findByIdAndDelete(id);
  return result;
};

export const offeredCourseService = {
  createOfferedCourse,
  getAllOfferedCourse,
  getSingleOfferedCourse,
  updateOfferedCourse,
  deleteOfferedCourse,
};
