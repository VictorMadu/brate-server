// import { QueryResult } from 'pg';
// import PostgresDb from '../Database/PostgresDb';
// import { Runner } from '../databases/db';

// class Seeder {
//     constructor(private runner: Runner<string, QueryResult<any>>) {}

//     handle() {}
// }

// function generateUsers(noOfUsers: number, noOfBanks: number, timeInterval: [Date, Date]) {
//     const usersData = [] as {
//         email: string;
//         name: string;
//         password: string;
//         phone: string;
//         isBank: boolean;
//         createdAt: Date;
//         verification: { otp: string; noOfTries: number; createdAt: Date; verifiedAt: Date };
//     }[];

//     const noOfBanksUsers = noOfBanks;
//     const noOfNonBankUsers = noOfUsers - noOfBanks;

//     for (let i = 0; i < noOfBanks; i++) {
//         usersData.push({
//             email: `test${i + 1}@gmail.com`,
//         });
//     }
// }
