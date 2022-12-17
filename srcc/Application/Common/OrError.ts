// import AppError, { NotAppError } from './Errors';

// export class OrError<Err extends AppError, SuccessResult extends unknown> {
//     constructor(
//         private appError: Err,
//         private onSuccess: () => SuccessResult = () => void 0 as SuccessResult,
//     ) {}

//     getResult() {
//         return this.onSuccess();
//     }

//     getError() {
//         return this.appError;
//     }

//     hasError() {
//         return !NotAppError.isType(this.appError);
//     }
// }
