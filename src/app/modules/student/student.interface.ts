import { Model, Types } from 'mongoose';

// export type TStudent = {
//   id: string;
//   user: Types.ObjectId;
//   name: UserName;
//   email: string;
//   gender: 'male' | 'female' | 'others';
//   age: number;
// dateOfBirth: Date;
//   guardian: string;
//   localGuardian: string;
//   contact: string;
//   emergencyContact: string;
//   blood?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
//   permanentAddress: UserAddress;
//   localAddress: UserAddress;
//   isDeleted?: boolean;
// };

export type TStudent = {
  id: string;
  user: Types.ObjectId;
  profileImage?: string;
  semester: Types.ObjectId;
  academicFaculty: Types.ObjectId;
  department: Types.ObjectId;
  registration: string;
  roll: string;
  name: UserName;
  email: string;
  gender: 'male' | 'female' | 'others';
  age: number;
  motherName: string;
  fatherName: string;
  matherContact: string;
  fatherContact: string;
  contact: string;
  blood?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  permanentAddress: UserAddress;
  localAddress: UserAddress;
  isDeleted?: boolean;
};

export type UserName = {
  firstName: string;
  middleName?: string;
  lastName: string;
};

export type UserAddress = {
  village?: string;
  postOffice: string;
  policeStation: string;
  town: string;
};

//create a statics user model

export interface StaticsStudentModel extends Model<TStudent> {
  // eslint-disable-next-line no-unused-vars
  isUserExists(email: string): Promise<TStudent | null>;
}
